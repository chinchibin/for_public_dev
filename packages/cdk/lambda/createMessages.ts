import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateMessagesRequest } from 'generative-ai-use-cases-jp';
import { batchCreateMessages } from './repository';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const req: CreateMessagesRequest = JSON.parse(event.body!);    
    const userId: string =
      event.requestContext.authorizer!.claims['cognito:username'];
    
    console.log(userId)
    const userPoolId = process.env.USERPOOL_ID!;
    console.log(userPoolId)
    const chatId = event.pathParameters!.chatId!;
    const messages = await batchCreateMessages(req.messages, userId, chatId, userPoolId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        messages,
      }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
