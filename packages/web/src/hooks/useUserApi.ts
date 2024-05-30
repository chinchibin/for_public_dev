import useHttp from './useHttp';

const useUserApi = () => {
  const http = useHttp();

  return {
    listS3Objects: async (param: object) => {
      const res = await http.post('rag/listS3Objects', { prompts: { ...param } });
      return res.data;
    },
  }
};

export default useUserApi;