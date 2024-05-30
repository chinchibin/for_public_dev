import { Construct } from 'constructs';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class Database extends Construct {
  public readonly table: ddb.Table;
  public readonly feedbackIndexName: string;
  public readonly dateFormattedIndexName: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const feedbackIndexName = 'FeedbackIndex';
    const dateFormattedIndexName = 'CreatedDateIndex'
    const table = new ddb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdDate',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });

    table.addGlobalSecondaryIndex({
      indexName: feedbackIndexName,
      partitionKey: {
        name: 'feedback',
        type: ddb.AttributeType.STRING,
      },
    });
    table.addGlobalSecondaryIndex({
      indexName: dateFormattedIndexName,
      partitionKey: {
        name: 'role',
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdDate',
        type: ddb.AttributeType.STRING,
      },
    });

    this.table = table;
    this.feedbackIndexName = feedbackIndexName;
  }
}
