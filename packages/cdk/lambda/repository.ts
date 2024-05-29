import {
  Chat,
  RecordedMessage,
  ToBeRecordedMessage,
  RecordedPrompt,
  ToBeRecordedPrompt,
  ShareId,
  UserIdAndChatId,
  SearchLogCondition,
} from 'generative-ai-use-cases-jp';
import * as crypto from 'crypto';
import { DynamoDBClient, } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument,  paginateScan, ScanCommandInput, } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand,  ListObjectsV2Command, PutObjectCommandInput, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import {
  BatchWriteCommand,  
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { DataSourceSyncStatus, S3Object } from 'generative-ai-use-cases-jp/src/s3';
import { Kendra, ListDataSourceSyncJobsCommand, ListDataSourceSyncJobsCommandInput, StartDataSourceSyncJobResponse } from '@aws-sdk/client-kendra';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { Condition } from 'aws-cdk-lib/aws-stepfunctions';


const TABLE_NAME: string = process.env.TABLE_NAME!;
const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);
const ddbDocClient = DynamoDBDocument.from(
  dynamoDb
);

const s3 = new S3Client({});
const bucketName = 'generativeaiusecasesstack-ragdatasourcebucket09187-no7y7ozm2zof';
const kendra = new Kendra({});
const cognito = new CognitoIdentityProviderClient({});

export const createChat = async (_userId: string): Promise<Chat> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${crypto.randomUUID()}`;
  const item = {
    id: userId,
    createdDate: `${Date.now()}`,
    chatId,
    usecase: '',
    title: '',
    updatedDate: '',
  };

  await dynamoDbDocument.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
};

export const findChatById = async (
  _userId: string,
  _chatId: string
): Promise<Chat | null> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${_chatId}`;
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :id',
      FilterExpression: '#chatId = :chatId',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#chatId': 'chatId',
      },
      ExpressionAttributeValues: {
        ':id': userId,
        ':chatId': chatId,
      },
    })
  );

  if (!res.Items || res.Items.length === 0) {
    return null;
  } else {
    return res.Items[0] as Chat;
  }
};

export const listChats = async (_userId: string): Promise<Chat[]> => {
  const userId = `user#${_userId}`;
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': userId,
      },
      ScanIndexForward: false,
    })
  );

  return res.Items as Chat[];
};

export const listMessages = async (
  _chatId: string
): Promise<RecordedMessage[]> => {
  const chatId = `chat#${_chatId}`;
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': chatId,
      },
    })
  );

  return res.Items as RecordedMessage[];
};

export const getCoNumber = async(userPoolId: string,  userId: string): Promise<string[]> => {
  const input = {
    "AttributesToGet": [
      "custom:employee_number",
      "email",
    ],
    "Filter": "username = \"" + userId + "\"",
    "Limit": 1,    
    "UserPoolId": userPoolId,
  };

  const command = new ListUsersCommand(input);
  const res = await cognito.send(command);

  let coNumber: string = ''
  let email: string = ''
  if (res.Users!  && res.Users.length > 0){
    res.Users[0].Attributes?.forEach((attribute) => {
      if (attribute.Name === 'email'){
        email = attribute.Value!
      }
      else{
        coNumber = attribute.Value!
      }
    })         
  }

  return [coNumber, email]
}

export const batchCreateMessages = async (
  messages: ToBeRecordedMessage[],
  _userId: string,
  _chatId: string,
  _userPoolId: string,
): Promise<RecordedMessage[]> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${_chatId}`;
  const createdDate = Date.now();
  const feedback = 'none';
  const coNumber = await getCoNumber(_userPoolId, _userId);

  const items: RecordedMessage[] = messages.map(    
    (m: ToBeRecordedMessage, i: number) => {    
      const createDateFormatted = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
      return {
        id: chatId,
        createdDate: `${createdDate + i}#0`,
        messageId: m.messageId,
        role: m.role,
        content: m.content,
        userId,
        feedback,
        usecase: m.usecase,
        llmType: m.llmType ?? '',
        coNumber: coNumber[0],
        email: coNumber[1],
        dateFormatted: createDateFormatted,
      };
    }
  );
  await dynamoDbDocument.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: items.map((m) => {
          return {
            PutRequest: {
              Item: m,
            },
          };
        }),
      },
    })
  );

  return items;
};

export const batchCreatePrompts = async (
  table_name: string,
  prompts: ToBeRecordedPrompt[],
  _userId: string,
): Promise<RecordedPrompt[]> => {
  const userId = `prompt#${_userId}`;
  const createdDate = new Date().toISOString();
  const items: RecordedPrompt[] = prompts.map(
    (p: ToBeRecordedPrompt, i: number) => {
      const newUserId = p.type === "1" ? "@@all" : userId;
      return {
        userId: newUserId,
        createdDate: createdDate,
        uuid:uuidv4(),
        title: p.title,
        content: p.content,
        type: p.type,
        updatedDate:createdDate,
      };
    }
  );
  await dynamoDbDocument.send(
    new BatchWriteCommand({
      RequestItems: {
        [table_name]: items.map((m) => {
          return {
            PutRequest: {
              Item: m,
            },
          };
        }),
      },
    })
  );
  return items;
};

export const updatePrompt = async (
  _userId: string,
  uuid: string,
  table_name: string,
  createdDate:string,
  content: string,
  type:string,
): Promise<RecordedPrompt> => {
  const userId = `prompt#${_userId}`;
  const newUserId= type === "1" ? "@@all" : userId;
  const res = await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: table_name,
      Key: {
        userId: newUserId,
        createdDate:createdDate,
      },
      UpdateExpression: 'set #content = :content',
      ConditionExpression: '#uuid = :uuid', 
      ExpressionAttributeNames: {
        '#content': 'content',
        '#uuid': 'uuid',
      },
      ExpressionAttributeValues: {
        ':content': content,
        ':uuid': uuid,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return res.Attributes as RecordedPrompt;
};

export const deletePrompt = async (
  _userId: string,
  uuid: string,
  table_name: string,
  createdDate:string,
  type:string,
): Promise<void> => {
  const userId = `prompt#${_userId}`;
  const newUserId= type === "1" ? "@@all" : userId;
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: table_name,
      Key: {
        userId: newUserId,
        createdDate: createdDate,
      },
      ConditionExpression: '#uuid = :uuid', 
      ExpressionAttributeNames: {
        '#uuid': 'uuid',
      },
      ExpressionAttributeValues: {
        ':uuid': uuid,
      },
    })
  );  
};

export const listPrompts = async (table_name: string, _userId: string): Promise<RecordedPrompt[]> => {
  const userId = `prompt#${_userId}`;
  const generalId = "@@all"; // 假设 "@@all" 用来标识通用提示
 
  // 执行第一次查询：基于用户ID或通用ID
  const res1 = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: table_name,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
  const res2 = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: table_name,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':userId': generalId,
      },
    }));
  const combinedItems = [...(res1.Items ?? []), ...(res2.Items ?? [])];
  return combinedItems as RecordedPrompt[];
};


export const setChatTitle = async (
  id: string,
  createdDate: string,
  title: string
) => {
  const res = await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        id: id,
        createdDate: createdDate,
      },
      UpdateExpression: 'set title = :title',
      ExpressionAttributeValues: {
        ':title': title,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return res.Attributes as Chat;
};

export const updateFeedback = async (
  _chatId: string,
  createdDate: string,
  feedback: string
): Promise<RecordedMessage> => {
  const chatId = `chat#${_chatId}`;
  const res = await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        id: chatId,
        createdDate,
      },
      UpdateExpression: 'set feedback = :feedback',
      ExpressionAttributeValues: {
        ':feedback': feedback,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return res.Attributes as RecordedMessage;
};


export const deleteChat = async (
  _userId: string,
  _chatId: string
): Promise<void> => {
  // Chat の削除
  const chatItem = await findChatById(_userId, _chatId);
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id: chatItem?.id,
        createdDate: chatItem?.createdDate,
      },
    })
  );

  // // Message の削除
  const messageItems = await listMessages(_chatId);
  await dynamoDbDocument.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: messageItems.map((m) => {
          return {
            DeleteRequest: {
              Key: {
                id: m.id,
                createdDate: m.createdDate,
              },
            },
          };
        }),
      },
    })
  );
};

export const createShareId = async (
  _userId: string,
  _chatId: string
): Promise<{
  shareId: ShareId;
  userIdAndChatId: UserIdAndChatId;
}> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${_chatId}`;
  const createdDate = `${Date.now()}`;
  const shareId = `share#${crypto.randomUUID()}`;

  const itemShareId = {
    id: `${userId}_${chatId}`,
    createdDate,
    shareId,
  };

  const itemUserIdAndChatId = {
    id: shareId,
    createdDate,
    userId,
    chatId,
  };

  await dynamoDbDocument.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE_NAME,
            Item: itemShareId,
          },
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: itemUserIdAndChatId,
          },
        },
      ],
    })
  );

  return {
    shareId: itemShareId,
    userIdAndChatId: itemUserIdAndChatId,
  };
};

export const findUserIdAndChatId = async (
  _shareId: string
): Promise<UserIdAndChatId | null> => {
  const shareId = `share#${_shareId}`;
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': shareId,
      },
    })
  );

  if (!res.Items || res.Items.length === 0) {
    return null;
  } else {
    return res.Items[0] as UserIdAndChatId;
  }
};

export const findShareId = async (
  _userId: string,
  _chatId: string
): Promise<ShareId | null> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${_chatId}`;
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': `${userId}_${chatId}`,
      },
    })
  );

  if (!res.Items || res.Items.length === 0) {
    return null;
  } else {
    return res.Items[0] as ShareId;
  }
};

export const deleteShareId = async (_shareId: string): Promise<void> => {
  const userIdAndChatId = await findUserIdAndChatId(_shareId);
  const share = await findShareId(
    // SAML 認証だと userId に # が含まれるため
    // 例: user#EntraID_hogehoge.com#EXT#@hogehoge.onmicrosoft.com
    userIdAndChatId!.userId.split('#').slice(1).join('#'),
    userIdAndChatId!.chatId.split('#')[1]
  );

  await dynamoDbDocument.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: {
              id: share!.id,
              createdDate: share!.createdDate,
            },
          },
        },
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: {
              id: userIdAndChatId!.id,
              createdDate: userIdAndChatId!.createdDate,
            },
          },
        },
      ],
    })
  );
};


export const listS3Bucket = async (prefix: string): Promise<S3Object[] | undefined> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.BucketName,
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    Prefix: prefix + '/',
    MaxKeys: 1000,
    Delimiter: '/',
  });

  try {
    let isTruncated = true;
   
    let contents: any[] = [];

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken, CommonPrefixes } =
        await s3.send(command);
      
      console.log(Contents);
      let files: any[] = []
      if (Contents != undefined){
        Contents!.forEach((x) => {
          if (x.Key! !== prefix + '/'){
            files.push({ key: x.Key!, type: 'File', lastModified: x.LastModified!, size: x.Size! });
          }           
        });
      }     
       

      let folders: any[] = [];
      if (CommonPrefixes != undefined){
        CommonPrefixes!.forEach((x) =>{
          folders.push({key: x.Prefix!, type: 'Folder', lastModified: '', size: ''});
        });
      }

      contents = contents.concat(folders)
      contents = contents.concat(files)

      isTruncated = IsTruncated ?? false;
      command.input.ContinuationToken = NextContinuationToken;
    }
    console.log(contents);

    return contents as S3Object[]

  } catch (err) {
    console.error(err);
  }
  return undefined
};


export const uploadS3Object = async (key: string, file: any) => {
    
    // 作成するファイル情報
    const putParams: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: file,
    }
    
    const putCommand = new PutObjectCommand(putParams);
    await s3.send(putCommand);    

}

export const deleteS3Object = async (bucketName: string, prefix: string) => {
  console.log(prefix)
  const command = new DeleteObjectCommand({
    Bucket: bucketName, 
    Key: prefix, 
  });
  console.log('bucketName ->', bucketName);
  console.log('prefix ->', prefix);
  
  await s3.send(command)
}

export const deleteFolder = async(bucketName: string, path: string) => {
  console.log(path)
  let count = 0; // number of files deleted
  async function recursiveDelete(token: string | undefined) {
    // get the files
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName, 
      Prefix: path,
      ContinuationToken: token
    });

    let list = await s3.send(listCommand);
    if (list.KeyCount) { // if items to delete
      // delete the files
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: list.Contents!.map((item) => ({ Key: item.Key })),
          Quiet: false,
        },
      });      
      let deleted = await s3.send(deleteCommand);
      
      if (deleted.Errors) {
        deleted.Errors.map((error) => console.log(`${error.Key} could not be deleted - ${error.Code}`));
      }

      count += deleted.Deleted?.length??0
    }
    // repeat if more files to delete
    if (list.NextContinuationToken) {
      recursiveDelete(list.NextContinuationToken);
    }
    
    console.log(`${count} file(s) is deleted! `)
    return `delete OK.`;
  };
  // start the recursive function
  return recursiveDelete(undefined);

}

export const searchLog = async (tableName: string, condition: SearchLogCondition): Promise<any> => {
  const paginatorConfig = {
    client: ddbDocClient,
    pageSize: 10,
  } 
  
  const params: ScanCommandInput = {
    ProjectionExpression: 'dateFormatted, coNumber, email, content',
    TableName: tableName,
    ExpressionAttributeNames: {
      '#role' : 'role',
    },
    ExpressionAttributeValues: {
      ":role": "user",
    },
    FilterExpression: '#role = :role '
  }

  if (condition.torokuDt){
    params.FilterExpression += 'and begins_with(#date, :torokuDt)';
    params.ExpressionAttributeValues![':torokuDt'] = condition.torokuDt
    params.ExpressionAttributeNames!['#date'] = 'dateFormatted'
  }
  else if(condition.bango){
    params.FilterExpression += 'and #bango = :bango';
    params.ExpressionAttributeValues![':bango'] = condition.bango
    params.ExpressionAttributeNames!['#bango'] = 'coNumber'
  }
  else if(condition.email){
    params.FilterExpression += 'and #email = :email';
    params.ExpressionAttributeValues![':email'] = condition.email
    params.ExpressionAttributeNames!['#email'] = 'email'
  }
  else if(condition.content){
    params.FilterExpression += 'and contains(#content, :content)';
    params.ExpressionAttributeValues![':content'] = condition.content
    params.ExpressionAttributeNames!['#content'] = 'content'
  }

  let allPage = 0;
  const items: any[] = [];

  if (!condition.torokuDt && !condition.bango &&
      !condition.email && !condition.content
  ){
    console.log('0 count!')
  }
  else {
    const paginator = paginateScan(paginatorConfig, params)
    let pg = condition.page??'1'
    const from = 10 * (Number(pg) - 1)
    const to = 10 * Number(pg)
    for await (const page of paginator){      
      if (page.Items){
        for (let li = 0; li < page.Items.length; li++) {
          let index = allPage + li + 1
          if(( index > from) && (index <= to)){
            items.push({
              'torokuDt': page.Items[li]['dateFormatted'],
              'bango': page.Items[li]['coNumber'],
              'email': page.Items[li]['email'],
              'content': page.Items[li]['content'],
            })
          }
        }
      }
      
      allPage = allPage + (page.Count ?? 0)
    }
  }
  
  return {'sum': allPage, 'items': items}
}


export const getSyncStatus = async (indexId: string, dataSourceId: string): Promise<DataSourceSyncStatus> =>{
  dataSourceId = dataSourceId.replace('|' + indexId, '')
  console.log('IndexId ->', indexId);
  console.log('DataSourceId ->', dataSourceId);

  const input: ListDataSourceSyncJobsCommandInput = {
    Id: dataSourceId,
    IndexId: indexId,
  };

  const result : DataSourceSyncStatus = { status: '-'};
  const command = new ListDataSourceSyncJobsCommand(input);  
  const response = await kendra.send(command);
  
  if (response.History && response.History.length > 0){
    const history = response.History!
    console.log(history)
    if(history.filter((x) => (x.Status === 'INCOMPLETE') || x.Status!.startsWith('SYNC'))
      .length > 0){
      result.status = 'sync'
    }
    else{
      result.status = history[0].EndTime!.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) 
    }
      
  }

  return result;
}

export const syncDatasource = async (indexId: string, dataSourceId: string) => { 
 
  try {
    dataSourceId = dataSourceId.replace('|' + indexId, '')
    console.log('IndexId ->', indexId);
    console.log('DataSourceId ->', dataSourceId);

    const dataSourceSyncResponse: StartDataSourceSyncJobResponse = await kendra.startDataSourceSyncJob({
      Id: dataSourceId,
      IndexId: indexId,
    }); 

   
    return dataSourceSyncResponse;
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};