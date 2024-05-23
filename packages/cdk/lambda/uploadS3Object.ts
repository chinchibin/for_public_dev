import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { uploadS3Object } from './repository';


export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {

    const body = event.body!;
    console.log(event.isBase64Encoded)
    console.log(file);
    const prompts = await uploadS3Object(file.name, file.stream);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        result: 'OK',
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


