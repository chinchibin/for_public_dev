import { useEffect } from 'react';
import { create } from 'zustand';
import userLogApi from './useLogApi';


const useLogState = create<{
  loading: boolean;
  sum: number,
  logList: {
    bango: String,
    email: String,
    status: String,
    role: Number,
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

  // const api = useFileApi();
  const {
    listS3Objects,
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
        // await new Promise(resolve => setTimeout(resolve, 200));
        const res = await listS3Objects(params);
        const { prompts, sum } = res;
        list = prompts || [];

        setSum(sum);
        updateLogList(list);
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
