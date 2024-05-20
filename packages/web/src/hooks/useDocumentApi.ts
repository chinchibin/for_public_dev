import {
  ListS3ObjectsRequest,
  ListS3ObjectsResponse,
} from 'generative-ai-use-cases-jp';

import useHttp from '../hooks/useHttp';

const useDocumentApi = () => {

  const http = useHttp();

  return {
    listS3Objects: async (): Promise<ListS3ObjectsResponse> => {
      const res = await http.post('rag/listS3Object', { prompts: { prefix: '/' } });
      return res.data;
    },
  }
};

export default useDocumentApi;