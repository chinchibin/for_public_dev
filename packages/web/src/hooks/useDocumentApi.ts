import {
  // ListS3ObjectsRequest,
  ListS3ObjectsResponse,
} from 'generative-ai-use-cases-jp';

import useHttp from '../hooks/useHttp';

const useDocumentApi = () => {

  const http = useHttp();

  return {
    listS3Objects: async (dirPath: string): Promise<ListS3ObjectsResponse> => {
      const res = await http.post('rag/listS3Objects', { prompts: { prefix: dirPath } });
      // const res = await http.post('http://localhost:5173/mock/getDocument.json', {});
      return res.data;
    },
  }
};

export default useDocumentApi;