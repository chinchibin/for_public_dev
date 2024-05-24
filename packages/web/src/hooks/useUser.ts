import { useEffect } from 'react';
import { create } from 'zustand';

let testIdx = 0;

const useUserState = create<{
  userList: {
    bango: String,
    email: String,
    status: String,
    role: Number,
  }[];
  getData: (value: any) => void;
}>((set, _get) => {

  const updateUserList = (list: any[]) => {
    set((_state) => {
      return {
        userList: list
      };
    });
  };

  return {
    userList: [],
    getData: async (data: object) => {
      let list: any[] = [];
      console.log(data);

      try {
        // --------------- mock data start ---------------
        await new Promise(resolve => setTimeout(resolve, 200));
        //const res = await http.post('chats', {});

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

const useUser = () => {
  const {
    userList,
    getData,
  } = useUserState();

  useEffect(() => {
    getData({});
  }, [getData]);

  return {
    userList,
    search: getData,
  };
};
export default useUser;
