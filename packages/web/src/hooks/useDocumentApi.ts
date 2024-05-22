import {
  // ListS3ObjectsRequest,
  ListS3ObjectsResponse,
} from 'generative-ai-use-cases-jp';

import useHttp from '../hooks/useHttp';
import axios from 'axios';
const BASEURL = import.meta.env.VITE_APP_API_ENDPOINT;

const useDocumentApi = () => {

  const http = useHttp();

  const fileToBase64 = (file: File): any => {
    return new Promise(function (resolve, reject) {
      try {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          resolve && resolve(reader.result);
        });
        reader.readAsDataURL(file);
      } catch (e) {
        reject && reject();
      }
    });
  }

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

    uploadFile: async (file: File, dirPath: string) => {
      let fileBase64: string = await fileToBase64(file);
      const formData = new FormData()
      formData.append('data', fileBase64);
      formData.append('name', dirPath + '/' + file.name);
      const res = await http.post('rag/uploadFiles', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },

    uploadFile1: async (file: File) => {
      const formData = new FormData()
      formData.append('data', file);
      return axios({
        method: 'PUT',
        url: BASEURL + 'rag/uploadFiles',
        headers: { 'Content-Type': 'multipart/form-data' }, // 'multipart/form-data'
        data: formData,
      });
    },
  }
};

export default useDocumentApi;