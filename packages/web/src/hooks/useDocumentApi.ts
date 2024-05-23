import {
  ListS3ObjectsResponse,
} from 'generative-ai-use-cases-jp';

import useHttp from '../hooks/useHttp';
import axios from 'axios';

const useDocumentApi = () => {

  const http = useHttp();


  return {
    listS3Objects: async (dirPath: string): Promise<ListS3ObjectsResponse> => {
      const res = await http.post('rag/listS3Objects', { prompts: { prefix: dirPath } });
      return res.data;
    },

    deleteS3Objects: async (dirPath: string) => {
      const res = await http.post('rag/deleteS3Objects', { prompts: { prefix: dirPath } });
      return res.data;
    },

    reloadS3Objects: async (dirPath: string) => {
      const res = await http.post('rag/reloadS3Objects', { prompts: { prefix: dirPath } });
      return res.data;
    },

    uploadFile: async (file: File, dirPath: string) => {
      const path = decodeURIComponent(dirPath + '/' + file.name)
      const res = await http.post('rag/getPreSignedUrl', {fileName: path})

      const formData = new FormData()
      formData.append('data', file);
      return axios({
        method: 'PUT',
        url: res.data,
        headers: res.data.headers,
        data: formData,
      });
    },

  }
};

export default useDocumentApi;