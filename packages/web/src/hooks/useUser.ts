import { useEffect } from 'react';
import { create } from 'zustand';
import useUserApi from './useUserApi';


const useUserState = create<{
  loading: boolean;
  sum: number,
  userList: {
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
  } = useUserApi();

  const updateUserList = (list: any[]) => {
    set((_state) => {
      return {
        userList: list
      };
    });
  };

  return {
    loading: false,
    sum: 0,
    userList: [],
    getData: async (params: any) => {
      showLoading();
      let list: any[] = [];
      console.log(params);

      try {
        // await new Promise(resolve => setTimeout(resolve, 200));
        const res = await listS3Objects(params);
        const { prompts, sum } = res;
        list = prompts || [];
        setSum(sum);
      } catch (e) {
        console.log(e);
        list = [];
      } finally {
        hideLoading();
      }
      updateUserList(list);
    },
  };
});

const useUser = () => {
  const {
    loading,
    sum,
    userList,
    getData,
  } = useUserState();

  useEffect(() => {
    getData({});
  }, [getData]);

  return {
    loading,
    sum,
    userList,
    search: getData,
  };
};
export default useUser;
