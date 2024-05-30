import { useEffect } from 'react';
import { create } from 'zustand';
import userLogApi from './useLogApi';


const useLogState = create<{
  loading: boolean;
  sum: number,
  logList: {
    bango: string,
    email: string,
    status: string,
    role: number,
  }[];
  getData: (value: any) => void;
}>((set, _get) => {

  const showLoading = () => {
    set(() => ({
      loading: true,
    }));
  };
  const hideLoading = () => {
    set(() => ({
      loading: false,
    }));
  };

  const setSum = (sum: number) => {
    set(() => ({
      sum
    }));
  };

  const {
    searchLog,
  } = userLogApi();

  const updateLogList = (list: any[]) => {
    set((_state) => {
      return {
        logList: list
      };
    });
  };

  return {
    loading: false,
    sum: 0,
    logList: [],
    getData: async (params: object) => {
      showLoading();
      let list: any[] = [];
      console.log(params);

      try {
        const res = await searchLog(params);
        const { prompts } = res;
        list = prompts.items || [];

        setSum(prompts.sum);
      } catch (e) {
        console.log(e);
        list = [];
      } finally {
        hideLoading();
      }
      updateLogList(list);
    },
  };
});

const useLog = () => {
  const {
    loading,
    sum,
    logList,
    getData,
  } = useLogState();

  useEffect(() => {
    getData({});
  }, [getData]);

  return {
    loading,
    sum,
    logList,
    search: getData,
  };
};
export default useLog;
