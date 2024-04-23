import { produce } from 'immer';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

const useDocumentState = create<{
  documentList: {
    id: String,
    type: Number,   // 0-folder, 1-file
    name: String,
    updateTime: String,
    size: String
  }[];
}>((set, get) => {

  const updateDocumentList = (list: any[]) => {
    set((state) => {
      return {
        documentList: list,
      };
    });
  };

  return {
    documentList: [],
    init: async () => {
      let list: any[] = [];
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        // mock data 
        list = [
          {
            id: '1',
            type: 0,   // 0-folder, 1-file
            name: 'テスト資料',
            updateTime: '数秒前',
            size: ''
          },
          {
            id: '2',
            type: 1, // 0-folder, 1-file
            name: 'エビデンス_20240422.xlsx',
            updateTime: '1分前',
            size: '1,234 MB'
          },
          {
            id: '3',
            type: 1, // 0-folder, 1-file
            name: '設計書_20240420.doc',
            updateTime: '10分前',
            size: '5,234 MB'
          }
        ];
      } catch (e) {
        console.log(e);
        list = [];
      } finally {
      }
      updateDocumentList(list);
    },
  };
});

const useDocument = (id: string) => {

  const {
    documentList,
    init
  } = useDocumentState();

  useEffect(() => {
    init();
  }, [init]);


  // const documentList1 = async () => {
  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 200));
  //     // mock data 
  //     let list = [
  //       {
  //         id: '1',
  //         type: 0,   // 0-folder, 1-file
  //         name: 'テスト資料',
  //         updateTime: '数秒前',
  //         size: ''
  //       },
  //       {
  //         id: '2',
  //         type: 0, // 0-folder, 1-file
  //         name: 'エビデンス_20240422.xlsx',
  //         updateTime: '1分前',
  //         size: '1,234 MB'
  //       },
  //       {
  //         id: '3',
  //         type: 0, // 0-folder, 1-file
  //         name: '設計書_20240420.doc',
  //         updateTime: '10分前',
  //         size: '5,234 MB'
  //       }
  //     ];
  //     return list;
  //   } catch (e) {
  //     console.log(e);
  //   } finally {
  //   }
  // };


  return {
    documentList,


    loading: false,
    messages: [],
    setLoading: (newLoading: boolean) => {
    },
    init: () => {
    },
    clear: () => {
    },
    sendFeedback: async (createdDate: string, feedback: string) => {
    },
  };
};
export default useDocument;
