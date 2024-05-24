import { produce } from 'immer';
import { useEffect } from 'react';
import { create } from 'zustand';
// import useFileApi from './useFileApi';
import userDocumentApi from './useDocumentApi';

const useDocumentState = create<{
  loading: boolean;
  documentList: {
    id: string,
    type: number,   // 0-folder, 1-file
    key: string,
    name: string,
    checked: boolean,
    updateTime: string,
    size: string,
    dirPath: string,
    desc: string,
  }[];
  dirList: {
    name: string, // current folder's name
    dirPath: string, // current folder's absolute path
  }[];
  reloadData: () => void;
  getData: (dirPath: string) => void;
  updateChecked: (i: number, chked: boolean) => void;
  deleteData: (delList: string[]) => void;
  uploadFile: (files: FileList, dirPath: string) => Promise<any>;
}>((set) => {

  // const api = useFileApi();
  const {
    listS3Objects,
    uploadFile,
    deleteS3Objects,
    reloadS3Objects
  } = userDocumentApi();

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

  return {
    loading: false,
    dirList: [],
    documentList: [],
    getData: async (_dirPath?: string) => {
      _dirPath = _dirPath?.replace(/(^\/)|(\/$)/gmi, '');
      let list: any[] = [];
      const defaultDir = 'docs';
      const curPath = _dirPath || defaultDir;

      try {
        // get data by dirPath. dirPath default is 'docs'
        const res = await listS3Objects(curPath);
        // await new Promise(resolve => setTimeout(resolve, 2000));
        const { prompts } = res;

        list = prompts || [];
        list = list.map((item) => {
          const { key, size, type } = item;
          const dirArr = key.replace(/\/$/, '').split('/');
          const name = dirArr.pop();

          const updateTime = item.lastModified.replace(/T/gmi, ' ').replace(/Z$/gmi, '').replace(/.\d{3}$/, '');
          let fsize = '';
          if (size) {
            fsize = Number((size / 1024 / 1024).toFixed(2)).toLocaleString("en-US") + 'MB'
          }

          let ftype = 0; // folder
          if (type.toLowerCase() === 'file') ftype = 1;

          return {
            updateTime, key, name,
            checked: false,
            size: fsize,
            type: ftype,
            dirPath: dirArr.join('/')
          };
        });
      } catch (e) {
        console.log(e);
        list = [];
      } finally {
        // console.log(list)
      }

      // add prev folder
      if (curPath !== defaultDir) {
        const arr = curPath.split('/'); // [ MSS, 1_設計書, 2_テスト資料 ]
        arr?.pop(); // [ MSS, 1_設計書 ]
        const prevPath = arr.join('/'); //  /MSS/1_設計書
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
    // ファイルのアップロード
    uploadFile: async (files: FileList, dirPath: string) => {
      showLoading();
      let promiseArr = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        promiseArr.push(uploadFile(file, dirPath));
      }
      return Promise.all(promiseArr).then((resultArr) => {
        let isOk = resultArr.every((res) => {
          return res.status === 200;
        });
        Promise.resolve(isOk);
        hideLoading();
      }).catch((error) => {
        console.error(error.message);
        Promise.reject();
        hideLoading();
      });
    },
    deleteData: async (delList: string[]) => {
      showLoading();
      try {
        const res = await deleteS3Objects(delList);
        console.log(res);
      } catch (e) {
        console.log(e)
      } finally {
        hideLoading();
      }
    },
    reloadData: async () => {
      showLoading();
      try {
        const res = await reloadS3Objects();
        console.log(res);
      } catch (e) {
        console.log(e)
      } finally {
        hideLoading();
      }
    },
    updateChecked: (i: number, chked: boolean) => {
      set((state) => {
        return {
          documentList: produce(state.documentList, (draft) => {
            draft[i].checked = chked;
          }),
        };
      });
    },
  };
});

const useDocument = () => {
  const {
    loading,
    documentList,
    dirList,
    getData,
    uploadFile,
    deleteData,
    reloadData,
    updateChecked,
  } = useDocumentState();

  useEffect(() => {
    getData('');
  }, [getData]);

  return {
    loading,
    documentList,
    dirList,
    gotoDir: getData,
    uploadFile,
    deleteData,
    reloadData,
    updateChecked
  };
};
export default useDocument;
