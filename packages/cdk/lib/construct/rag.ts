import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Duration, Token, Arn, RemovalPolicy } from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { list } from '@material-tailwind/react';

export interface RagProps {
  userPool: UserPool;
  api: RestApi;
}

/**
 * RAG を実行するためのリソースを作成する
 */
export class Rag extends Construct {
  constructor(scope: Construct, id: string, props: RagProps) {
    super(scope, id);

    const kendraIndexArnInCdkContext =
      this.node.tryGetContext('kendraIndexArn');

    const kendraDataSourceBucketName = this.node.tryGetContext(
      'kendraDataSourceBucketName'
    );

    let kendraIndexArn: string;
    let kendraIndexId: string;
    let dataSourceBucket: s3.IBucket | null = null;
    let datasourceId: string;
    let datasourceArn: string;

    if (kendraIndexArnInCdkContext) {
      // 既存の Kendra Index を利用する場合
      kendraIndexArn = kendraIndexArnInCdkContext!;
      kendraIndexId = Arn.extractResourceName(
        kendraIndexArnInCdkContext,
        'index'
      );
      datasourceId = ''
      datasourceArn = ''
      // 既存の S3 データソースを利用する場合は、バケット名からオブジェクトを生成
      if (kendraDataSourceBucketName) {
        dataSourceBucket = s3.Bucket.fromBucketName(
          this,
          'DataSourceBucket',
          kendraDataSourceBucketName
        );
      }
    } else {
      // 新規に Kendra Index を作成する場合
      const indexRole = new iam.Role(this, 'KendraIndexRole', {
        assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
      });

      indexRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: ['s3:GetObject'],
        })
      );

      indexRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
      );

      const index = new kendra.CfnIndex(this, 'KendraIndex', {
        name: 'generative-ai-use-cases-index',
        edition: 'DEVELOPER_EDITION',
        roleArn: indexRole.roleArn,

        // トークンベースのアクセス制御を実施
        // 参考: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kendra-index.html#cfn-kendra-index-usercontextpolicy
        userContextPolicy: 'USER_TOKEN',

        // 認可に利用する Cognito の情報を設定
        userTokenConfigurations: [
          {
            jwtTokenTypeConfiguration: {
              keyLocation: 'URL',
              userNameAttributeField: 'cognito:username',
              groupAttributeField: 'cognito:groups',
              url: `${props.userPool.userPoolProviderUrl}/.well-known/jwks.json`,
            },
          },
        ],
      });

      kendraIndexArn = Token.asString(index.getAtt('Arn'));
      kendraIndexId = index.ref;

      const corsRule = [{
        allowedMethods: [s3.HttpMethods.PUT],
        allowedOrigins: ['*'],      
        allowedHeaders: ['*'],
        exposedHeaders: [],
      }];

      // .pdf や .txt などのドキュメントを格納する S3 Bucket
      dataSourceBucket = new s3.Bucket(this, 'DataSourceBucket', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        serverAccessLogsPrefix: 'logs',
        enforceSSL: true,
        cors: corsRule,
      });
      
      // /kendra/docs ディレクトリを Bucket にアップロードする
      new s3Deploy.BucketDeployment(this, 'DeployDocs', {
        sources: [s3Deploy.Source.asset('./kendra-docs')],
        destinationBucket: dataSourceBucket,
      });

      const s3DataSourceRole = new iam.Role(this, 'DataSourceRole', {
        assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
      });

      s3DataSourceRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [`arn:aws:s3:::${dataSourceBucket.bucketName}`],
          actions: ['s3:ListBucket'],
        })
      );

      s3DataSourceRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [`arn:aws:s3:::${dataSourceBucket.bucketName}/*`],
          actions: ['s3:GetObject'],
        })
      );

      s3DataSourceRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [Token.asString(index.getAtt('Arn'))],
          actions: ['kendra:BatchPutDocument', 'kendra:BatchDeleteDocument'],
        })
      );

      const datasource = new kendra.CfnDataSource(this, 'S3DataSource', {
        indexId: index.ref,
        type: 'S3',
        name: 's3-data-source',
        roleArn: s3DataSourceRole.roleArn,
        languageCode: 'ja',
        dataSourceConfiguration: {
          s3Configuration: {
            bucketName: dataSourceBucket.bucketName,
            inclusionPrefixes: ['docs'],
          },
        },
      });
      datasourceId = datasource.ref;
      datasourceArn = Token.asString(datasource.getAtt('Arn'));

    }

    
    

    // RAG 関連の API を追加する
    // Lambda
    const queryFunction = new NodejsFunction(this, 'Query', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/queryKendra.ts',
      timeout: Duration.minutes(15),
      bundling: {
        // 新しい Kendra の機能を使うため、AWS SDK を明示的にバンドルする
        externalModules: [],
      },
      environment: {
        INDEX_ID: kendraIndexId,
      },
    });
    queryFunction.role?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [kendraIndexArn],
        actions: ['kendra:Query'],
      })
    );

    const listS3ObjectsFunction = new NodejsFunction(this, 'ListS3Objects', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/listS3Objects.ts',
      timeout: Duration.minutes(15),
      environment: {
        BucketName: dataSourceBucket!.bucketName,
      },
    });
    if (dataSourceBucket) {
      dataSourceBucket.grantRead(listS3ObjectsFunction);
    }

    const deleteS3ObjectsFunction = new NodejsFunction(this, 'deleteObjects', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/deleteS3Objects.ts',
      timeout: Duration.minutes(15),
      environment: {
        BucketName: dataSourceBucket!.bucketName,
      },
    });

    if (dataSourceBucket) {
      dataSourceBucket.grantReadWrite(deleteS3ObjectsFunction);
    }

    const uploadS3ObjectFunction = new NodejsFunction(this, 'uploadS3Object', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/uploadS3Object.ts',
      timeout: Duration.minutes(15),
    });

    if (dataSourceBucket) {
      dataSourceBucket.grantPut(uploadS3ObjectFunction);
    }

    // Lambda
    const getSignedUrlFunction = new NodejsFunction(this, 'GetSignedUrl', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/getRagFileUploadSignedUrl.ts',
      timeout: Duration.minutes(15),
      environment: {
        BUCKET_NAME: dataSourceBucket!.bucketName,
      },
    });
    if(dataSourceBucket){
      dataSourceBucket.grantPut(getSignedUrlFunction);
    }

    const syncDatasourceFunction = new NodejsFunction(this, 'syncDatasource', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/syncDatasource.ts',
      timeout: Duration.minutes(15),
      environment: {
        KendraIndexId: kendraIndexId,
        DataSourceId: datasourceId,
      },
    });
    syncDatasourceFunction.role?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ['kendra:StartDataSourceSyncJob'],
      })
    );

    const getSyncStatusFunction = new NodejsFunction(this, 'getSyncStatus', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/getSyncStatus.ts',
      timeout: Duration.minutes(15),
      environment: {
        KendraIndexId: kendraIndexId,
        DataSourceId: datasourceId,
      },
    });
    getSyncStatusFunction.role?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ['kendra:ListDataSourceSyncJobs'],
      })
    );

    const retrieveFunction = new NodejsFunction(this, 'Retrieve', {
      runtime: Runtime.NODEJS_18_X,
      entry: './lambda/retrieveKendra.ts',
      timeout: Duration.minutes(15),
      bundling: {
        // 新しい Kendra の機能を使うため、AWS SDK を明示的にバンドルする
        externalModules: [],
      },
      environment: {
        INDEX_ID: kendraIndexId,
      },
    });
    retrieveFunction.role?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [kendraIndexArn],
        actions: ['kendra:Retrieve'],
      })
    );

    // S3 データソース関連
    const getDocDownloadSignedUrlFunction = new NodejsFunction(
      this,
      'GetDocDownloadSignedUrlFunction',
      {
        runtime: Runtime.NODEJS_18_X,
        entry: './lambda/getDocDownloadSignedUrl.ts',
        timeout: Duration.minutes(15),
      }
    );
    if (dataSourceBucket) {
      dataSourceBucket.grantRead(getDocDownloadSignedUrlFunction);
    }

    // API Gateway
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });

    const commonAuthorizerProps = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer,
    };
    const ragResource = props.api.root.addResource('rag');

    const queryResource = ragResource.addResource('query');
    // POST: /rag/query
    queryResource.addMethod(
      'POST',
      new LambdaIntegration(queryFunction),
      commonAuthorizerProps
    );

    const listS3ObjectsResource = ragResource.addResource('listS3Objects');
    // POST: /rag/listS3Objects
    listS3ObjectsResource.addMethod(
      'POST',
      new LambdaIntegration(listS3ObjectsFunction),
      commonAuthorizerProps
    );

    const deleteS3ObjectsResource = ragResource.addResource('deleteS3Objects');
    // POST: /rag/deleteS3Objects
    deleteS3ObjectsResource.addMethod(
      'POST',
      new LambdaIntegration(deleteS3ObjectsFunction),
      commonAuthorizerProps
    );

    const uploadS3ObjectResource = ragResource.addResource('uploadS3Object');
    // POST: /rag/uploadS3Object
    uploadS3ObjectResource.addMethod(
      'POST',
      new LambdaIntegration(uploadS3ObjectFunction),
      commonAuthorizerProps
    );

    const getPreSignedUrlResource = ragResource.addResource('getPreSignedUrl');
    // POST: /rag/getPreSignedUrl
    getPreSignedUrlResource.addMethod(
      'POST',
      new LambdaIntegration(getSignedUrlFunction),
      commonAuthorizerProps
    );

    const syncDatasourceResource = ragResource.addResource('syncDatasource');
    // POST: /rag/syncDatasource
    syncDatasourceResource.addMethod(
      'POST',
      new LambdaIntegration(syncDatasourceFunction),
      commonAuthorizerProps
    );

    const getSyncStatusResource = ragResource.addResource('getSyncStatus');
    // POST: /rag/getSyncStatus
    getSyncStatusResource.addMethod(
      'POST',
      new LambdaIntegration(getSyncStatusFunction),
      commonAuthorizerProps
    );

    const retrieveResource = ragResource.addResource('retrieve');
    // POST: /rag/retrieve
    retrieveResource.addMethod(
      'POST',
      new LambdaIntegration(retrieveFunction),
      commonAuthorizerProps
    );

    const docResource = ragResource.addResource('doc');
    // POST: /rag/doc/download-url
    docResource
      .addResource('download-url')
      .addMethod(
        'GET',
        new LambdaIntegration(getDocDownloadSignedUrlFunction),
        commonAuthorizerProps
      );
  }
}
