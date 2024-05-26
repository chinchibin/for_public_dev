import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSyncStatus } from './repository';


export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const indexId = process.env.KendraIndexId!
    const datasourceId = process.env.DataSourceId!
    const result = await getSyncStatus(indexId, datasourceId);    

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        result
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
