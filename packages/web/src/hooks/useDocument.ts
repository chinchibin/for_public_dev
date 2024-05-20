//import { produce } from 'immer';
import { useEffect } from 'react';
import { create } from 'zustand';
import useFileApi from './useFileApi';
import userDocumentApi from './useDocumentApi';

const useDocumentState = create<{
  documentList: {
    id: string,
    type: number,   // 0-folder, 1-file
    name: string,
    updateTime: string,
    size: string,
    dirPath: string,
    desc: string,
  }[];
  dirList: {
    name: string, // current folder's name
    dirPath: string, // current folder's absolute path
  }[],
  getData: (dirPath: string) => void;
  uploadFile: (file: File) => Promise<void>;
}>((set) => {

  const api = useFileApi();
  const {
    listS3Objects,
  } = userDocumentApi();

  const updateDocumentList = (list: any[]) => {
    set((_state) => {
      list.forEach((item) => {
        item.checked = false; // type=file，checkbox あり
      });
      return {
        documentList: list
      };
    });
  };

  const updateDirList = (list: any[]) => {
    set((_state) => {
      const dirList: any[] = [];

      if (list.length == 0) {
        return { dirList };
      }

      const dirPath = list[list.length - 1].dirPath;
      if (!dirPath) {
        return { dirList };
      }

      const strList = dirPath.replace(/^\//g, '').replace(/\/+$/g, '').split('/');

      let curPath = '';
      strList.map((name: string, _i: number) => {
        curPath += '/' + name;
        dirList.push({
          name: name,
          dirPath: curPath
        })
      });

      // the last dir don't refresh
      if (dirList.length > 0) {
        dirList[dirList.length - 1].dirPath = '';
      }

      return { dirList };
    });
  };

  const uploadFile = async (file: File) => {
    // set(() => ({
    //   loading: true,
    //   recognizedText: '',
    // }));

    const mediaFormat = file?.name.split('.').pop() as string;

    // 署名付き URL の取得
    const signedUrlRes = await api.getSignedUrl({
      mediaFormat: mediaFormat,
    });
    const signedUrl = signedUrlRes.data;
    const fileUrl = signedUrl.split(/[?#]/)[0]; // 署名付き url からクエリパラメータを除外

    // ファイルのアップロード
    await api.uploadFile(signedUrl, { file: file });

    // ファイル認識
    //const res = 
    await api
      .recognizeFile({
        fileUrl: fileUrl,
      })
      .finally(() => {
        // set(() => ({
        //   loading: false,
        // }));
      });


  };

  return {
    dirList: [],
    documentList: [],
    getData: async (_dirPath?: string) => {
      let list: any[] = [];

      try {
        // get data by dirPath. dirPath default is ''

        // --------------- mock data start ---------------
        // await new Promise(resolve => setTimeout(resolve, 200));
        const res = await listS3Objects(_dirPath || '');
        const { prompts } = res;

        list = prompts || [];
        list = list.map((item) => {
          let { key, size, type } = item;
          let dirArr = key.split('/');
          let name = dirArr.pop();

          let updateTime = item.lastModified.replace(/T/gmi, ' ').replace(/Z$/gmi, '');

          let ftype = 0; // folder
          if (type.toLowerCase() === 'file') ftype === 1;

          return {
            updateTime, name, size,
            type: ftype,
            dirPath: dirArr.join('/')
          };
        });

        // let foramtPath = dirPath?.replace(/\/+$/g, '');
        // for (let i = 0; i < 4; i++) {
        //   list.push({
        //     id: i.toString(),
        //     type: i === 0 ? 0 : 1,   // 0-folder, 1-file
        //     name: i === 0 ? '設計書履歴_' + testIdx : 'ファイル_' + testIdx,
        //     updateTime: '数秒前',
        //     size: '',
        //     dirPath: foramtPath || '',
        //     desc: '',
        //   });
        //   testIdx++;
        // }

        // --------------- mock data end ---------------

      } catch (e) {
        console.log(e);
        list = [];
      } finally {
        console.log(list)
      }

      // add prev folder
      if (list.length > 0 && list[0].dirPath) {
        const arr = list[0].dirPath.replace(/^\//g, '').replace(/\/+$/g, '').split('/'); // [ MSS, 1_設計書, 2_テスト資料 ]
        arr?.pop(); // [ MSS, 1_設計書 ]
        const prevPath = '/' + arr.join('/'); //  /MSS/1_設計書
        list.unshift(
          {
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
    uploadFile,
  };
});

const useDocument = (id: string) => {
  const {
    documentList,
    dirList,
    getData,
    uploadFile
  } = useDocumentState();

  useEffect(() => {
    getData(id);
  }, [id, getData]);

  return {
    documentList,
    dirList,
    gotoDir: getData,
    uploadFile,
  };
};
export default useDocument;
