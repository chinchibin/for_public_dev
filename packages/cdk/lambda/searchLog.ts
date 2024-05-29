import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { searchLog } from './repository';
import { SearchLogRequest } from 'generative-ai-use-cases-jp';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const req: SearchLogRequest = JSON.parse(event.body!);    
    console.log('REQ:' + event.body);
    const prompts = await searchLog(process.env.TABLE_NAME!, req.prompts);

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
