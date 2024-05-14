import { produce } from 'immer';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import useHttp from './useHttp';

let testIdx = 0;

const useLogState = create<{
  logList: {
    bango: String,
    email: String,
    status: String,
    role: Number,
  }[];
  getData: (type: number, value: string) => void;
}>((set, get) => {

  const updateLogList = (list: any[]) => {
    set((state) => {
      return {
        logList: list
      };
    });
  };

  return {
    logList: [],
    getData: async (data?: object) => {
      const http = useHttp();
      let list: any[] = [];

      try {
        // --------------- mock data start ---------------
        let params = data;
        await new Promise(resolve => setTimeout(resolve, 200));
        // const res = await http.post('chats', {});

        for (let i = 1; i < 11; i++) {
          let id = i.toString().padStart(4, '0');
          list.push({
            bango: `${id}`,
            email: `test.${id}@miraito-one.com`,
            createdTime: '2024/04/15 14:08:23',
            content: '選択された場合にメールアドレスのテキストボックスを有効にする\r\n選択された場合に社員番号のテキストボックスを無効にする',
          });
          testIdx++;
        }
        // --------------- mock data end ---------------

      } catch (e) {
        console.log(e);
        list = [];
      } finally {
      }
      updateLogList(list);
    },
  };
});

const useLog = (id: string) => {
  const {
    logList,
    getData,
  } = useLogState();

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    logList,
    search: getData,
  };
};
export default useLog;
