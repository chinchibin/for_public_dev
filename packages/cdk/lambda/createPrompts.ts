import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreatePromptsRequest } from 'generative-ai-use-cases-jp';
import { batchCreatePrompts } from './repository';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const req: CreatePromptsRequest = JSON.parse(event.body!);
    const userId: string =
      event.requestContext.authorizer!.claims['cognito:username'];
    const prompts = await batchCreatePrompts(req.prompts, userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        prompts,
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
