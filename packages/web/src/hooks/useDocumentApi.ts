import {
  // ListS3ObjectsRequest,
  ListS3ObjectsResponse,
} from 'generative-ai-use-cases-jp';

import useHttp from '../hooks/useHttp';
import axios from 'axios';
const BASEURL = import.meta.env.VITE_APP_API_ENDPOINT;

const useDocumentApi = () => {

  const http = useHttp();

  return {
    listS3Objects: async (dirPath: string): Promise<ListS3ObjectsResponse> => {
      const res = await http.post('rag/listS3Objects', { prompts: { prefix: dirPath } });
      // const res = await http.post('http://localhost:5173/mock/getDocument.json', { prefix: dirPath });
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

    uploadFile: async (file: File) => {
      const res = await http.post('rag/uploadFiles', { data: file }, { headers: { 'Content-Type': 'file/*' } });
      return res.data;
    },

    uploadFile1: async (file: File) => {
      return axios({
        method: 'PUT',
        url: BASEURL + 'rag/uploadFiles',
        headers: { 'Content-Type': 'file/*' }, // 'multipart/form-data'
        data: file,
      });
    },
  }
};

export default useDocumentApi;