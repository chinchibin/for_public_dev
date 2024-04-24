import { produce } from 'immer';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

const useDocumentState = create<{
  documentList: {
    id: String,
    type: Number,   // 0-folder, 1-file
    name: String,
    updateTime: String,
    size: String,
    dirPath: String,
    desc: String,
  }[];
  dirList: {
    name: String, // current folder's name
    dirPath: String, // current folder's absolute path
  }[],
  getData: (dirPath: String) => void;
}>((set, get) => {

  const updateDocumentList = (list: any[]) => {
    set((state) => {
      list.forEach((item) => {
        item.checked = false; // type=file，checkbox あり
      });
      return {
        documentList: list
      };
    });
  };

  const updateDirList = (list: any[]) => {
    set((state) => {
      let dirList: any[] = [];

      if (list.length == 0) {
        return { dirList };
      }

      let strList = list[list.length - 1].dirPath?.replace(/^\//g, '').split('/');

      let curPath = '';
      strList.map((name: String, i: Number) => {
        curPath += '/' + name;
        dirList.push({
          name: name,
          dirPath: curPath
        })
      });

      if (dirList.length > 0) {
        dirList[dirList.length - 1].dirPath = '';
      }

      return { dirList };
    });
  };

  return {
    dirList: [],
    documentList: [],
    getData: async (dirPath?: String) => {
      let list: any[] = [];

      try {
        // get data by dirPath. dirPath default is ''
        await new Promise(resolve => setTimeout(resolve, 200));

        // mock data 
        list = [
          {
            id: '1',
            type: 0,   // 0-folder, 1-file
            name: '設計書履歴',
            updateTime: '数秒前',
            size: '',
            dirPath: '/MSS/1_設計書/2_テスト資料',
            desc: '',
          },
          {
            id: '2',
            type: 1, // 0-folder, 1-file
            name: 'エビデンス_20240422.xlsx',
            updateTime: '1分前',
            size: '1,234 MB',
            dirPath: '/MSS/1_設計書/2_テスト資料',
            desc: '',
          },
          {
            id: '3',
            type: 1, // 0-folder, 1-file
            name: '設計書_20240420.doc',
            updateTime: '10分前',
            size: '5,234 MB',
            dirPath: '/MSS/1_設計書/2_テスト資料',
            desc: '',
          }
        ];

      } catch (e) {
        console.log(e);
        list = [];
      } finally {
      }


      // add prev folder
      if (list.length > 0) {
        let arr = list[0].dirPath?.replace(/^\//g, '').split('/'); // [ MSS, 1_設計書, 2_テスト資料 ]
        arr.pop(); // [ MSS, 1_設計書 ]
        let prevPath = '/' + arr.join('/'); //  /MSS/1_設計書
        list.unshift(
          {
            id: '0',
            type: 2,   // 0-folder, 1-file,  2-prev folder
            name: '',
            updateTime: '-',
            size: '',
            dirPath: prevPath,
            desc: 'Previous folder',
          },
        )
      }

      updateDocumentList(list);
      updateDirList(list);
    },
  };
});

const useDocument = (id: string) => {
  const {
    documentList,
    dirList,
    getData
  } = useDocumentState();

  useEffect(() => {
    getData();
  }, [getData]);

  return {
    documentList,
    dirList,
    gotoDir: getData,
  };
};
export default useDocument;
