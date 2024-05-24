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
  syncStatus: {
    status: number, // 0-未同期, 1-同期中, 2-同期時間ある
    text: string, // 内容
  };
  reloadData: () => void;
  getSyncStatus: () => void;
  getData: (dirPath: string) => void;
  updateChecked: (i: number, chked: boolean) => void;
  deleteData: (delList: string[]) => void;
  uploadFile: (files: FileList, dirPath: string) => Promise<any>;
}>((set) => {

  const defaultDir = 'docs';

  // const api = useFileApi();
  const {
    listS3Objects,
    uploadFile,
    deleteS3Objects,
    reloadS3Objects,
    getSyncStatus
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

  // 0-未同期, 1-同期中, 2-同期時間ある
  const setSyncStatus = (result: string) => {
    let status = 0;
    let text = '';
    if (result === "sync") {
      status = 1;
      text = '同期中';
    } else if (/^\d{4}/gmi.test(result)) {
      status = 2;
      text = result;
    }
    set(() => ({
      syncStatus: { status, text }
    }));
  };

  const updateDirList = (dirPath: string) => {
    set((_state) => {
      const dirList: any[] = [];
      const strList = dirPath.replace(/^\//g, '').replace(/\/+$/g, '').split('/');
      let curPath = '';
      strList.map((name: string, _i: number) => {
        curPath += '/' + name;
        dirList.push({
          name: name,
          dirPath: curPath
        })
      });
      return { dirList };
    });
  };
  const getSyncStatusFn = async () => {
    try {
      const { result } = await getSyncStatus();
      setSyncStatus(result?.status || '');
    } catch (e) {
      // setSyncStatus('sync');
      // setSyncStatus('-');
      // setSyncStatus('2024-05-24 10:05:34');
      console.log(e)
    } finally {
    }
  };

  return {
    loading: false,
    syncStatus: { status: 0, text: '' },
    dirList: [],
    documentList: [],
    getData: async (_dirPath?: string) => {
      _dirPath = _dirPath?.replace(/(^\/)|(\/$)/gmi, '');
      let list: any[] = [];
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
      updateDirList(curPath);

      getSyncStatusFn();
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
    getSyncStatus: getSyncStatusFn
  };
});

const useDocument = () => {
  const {
    loading,
    syncStatus,
    documentList,
    dirList,
    getData,
    uploadFile,
    deleteData,
    reloadData,
    updateChecked,
    getSyncStatus,
  } = useDocumentState();

  useEffect(() => {
    getData('');
  }, [getData]);

  return {
    loading,
    syncStatus,
    documentList,
    dirList,
    gotoDir: getData,
    uploadFile,
    deleteData,
    reloadData,
    updateChecked,
    getSyncStatus
  };
};
export default useDocument;
