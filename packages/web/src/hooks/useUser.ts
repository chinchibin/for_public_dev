import { produce } from 'immer';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import useHttp from './useHttp';

let testIdx = 0;

const useUserState = create<{
  userList: {
    bango: String,
    email: String,
    status: String,
    role: Number,
  }[];
  getData: (type: number, value: string) => void;
}>((set, get) => {

  const updateUserList = (list: any[]) => {
    set((state) => {
      return {
        userList: list
      };
    });
  };

  return {
    userList: [],
    getData: async (data?: object) => {
      const http = useHttp();
      let list: any[] = [];

      try {
        // --------------- mock data start ---------------
        let params = data;
        await new Promise(resolve => setTimeout(resolve, 200));
        const res = await http.post('chats', {});

        for (let i = 1; i < 11; i++) {
          let id = i.toString().padStart(4, '0');
          list.push({
            bango: `${id}`,
            email: `test.${id}@miraito-one.com`,
            status: '有効',
            role: '利用者',
          });
          testIdx++;
        }
        // --------------- mock data end ---------------

      } catch (e) {
        console.log(e);
        list = [];
      } finally {
      }
      updateUserList(list);
    },
  };
});

const useUser = (id: string) => {
  const {
    userList,
    getData,
  } = useUserState();

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    userList,
    search: getData,
  };
};
export default useUser;
