import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteS3Object, deleteFolder } from './repository';
import { DeleteS3Object } from 'generative-ai-use-cases-jp';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const req: DeleteS3Object = JSON.parse(event.body!);
    for (const prefix of req.prompts.prefixes) {
        if (prefix.endsWith('/')){          
          await deleteFolder(process.env.BucketName!, prefix.slice(0, -1))
        }
        else{
          await deleteS3Object(process.env.BucketName!, prefix)
        }
        
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        'result': 'delete ok!',
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
