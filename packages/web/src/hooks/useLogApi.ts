import useHttp from './useHttp';

const useLogApi = () => {

  const http = useHttp();


  return {
    searchLog: async (param: object) => {      
      const res = await http.post('log/searchLog', { prompts: { ...param } });
      return res.data;
    },
  }
};

export default useLogApi;