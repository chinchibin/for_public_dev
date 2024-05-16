import {
  Chat,
  RecordedMessage,
  ToBeRecordedMessage,
  RecordedPrompt,
  ToBeRecordedPrompt,
  ShareId,
  UserIdAndChatId,
} from 'generative-ai-use-cases-jp';
import * as crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { S3Object } from 'generative-ai-use-cases-jp/src/s3';

const TABLE_NAME: string = process.env.TABLE_NAME!;
const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

const s3 = new S3Client({});


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

export const batchCreateMessages = async (
  messages: ToBeRecordedMessage[],
  _userId: string,
  _chatId: string
): Promise<RecordedMessage[]> => {
  const userId = `user#${_userId}`;
  const chatId = `chat#${_chatId}`;
  const createdDate = Date.now();
  const feedback = 'none';

  const items: RecordedMessage[] = messages.map(
    (m: ToBeRecordedMessage, i: number) => {
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
        ['Prompt']: items.map((m) => {
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
  createdDate:string,
  content: string,
  type:string,
): Promise<RecordedPrompt> => {
  const userId = `prompt#${_userId}`;
  const newUserId= type === "1" ? "@@all" : userId;
  const res = await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: 'Prompt',
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
  createdDate:string,
  type:string,
): Promise<void> => {
  const userId = `prompt#${_userId}`;
  const newUserId= type === "1" ? "@@all" : userId;
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: 'Prompt',
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

export const listPrompts = async (_userId: string): Promise<RecordedPrompt[]> => {
  const userId = `prompt#${_userId}`;
  const generalId = "@@all"; // 假设 "@@all" 用来标识通用提示
 
  // 执行第一次查询：基于用户ID或通用ID
  const res1 = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: 'Prompt',
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
      TableName: 'Prompt',
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


export const listS3Bucket = async (prefix: string): Promise<S3Object[]> => {
  const command = new ListObjectsV2Command({
    Bucket: "my-bucket",
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 1,
  });

  try {
    let isTruncated = true;

    console.log("Your bucket contains the following objects:\n");
    let contents: any[] = [];

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await s3.send(command);
      if (Contents == undefined){
        break
      }
      
      contents = Contents!.map((x) => {
        return { key: x.Key!, lastModified: x.LastModified! };
      });


      isTruncated = IsTruncated ?? false;
      command.input.ContinuationToken = NextContinuationToken;
    }
    console.log(contents);

    return contents as S3Object[]

  } catch (err) {
    console.error(err);
  }
  
};