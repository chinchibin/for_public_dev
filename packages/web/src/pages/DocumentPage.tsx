import React, { useEffect, useRef, useState } from 'react';
// import { useLocation } from 'react-router-dom';
//import { create } from 'zustand';
//import useTyping from '../hooks/useTyping';
//import { MODELS } from '../hooks/useModel';
import useDocument from '../hooks/useDocument';

import Card from '../components/Card';
import Button from '../components/Button';
import ModalDialog from '../components/ModalDialog';
import { Text, Loader } from '@aws-amplify/ui-react';
import { Checkbox } from '@fluentui/react'; // import  Checkbox  from '../components/Checkbox';

const DocumentPage: React.FC = () => {

  // const { state } = useLocation() as Location<EditorialPageLocationState>;
  // const { pathname } = useLocation();
  const {
    loading,
    syncStatus,
    documentList, dirList,
    gotoDir,
    uploadFile,
    deleteData,
    reloadData,
    updateChecked,
    getSyncStatus,
  } = useDocument();

  const [openDialog, setOpenDialog] = useState(false);
  const [openReloadDialog, setOpenReloadDialog] = useState(false);
  const [delBtnVisible, setBtnVisible] = useState(false);

  const refFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const flag = documentList.some((item: any, _i: number) => {
      return item.checked;
    });
    setBtnVisible(flag);
  }, [documentList, setBtnVisible]);

  const getCurPath = () => {
    let curPath = dirList.map((item) => {
      return item.name;
    });
    return curPath.join('/');
  };

  const uploadCommon = async (files: FileList) => {
    return uploadFile(files, getCurPath())
  };

  // ========== drop upload ==========
  // const onClickExec = useCallback(() => {
  //   if (loading) return;
  //   recognizeFile();
  // }, [recognizeFile, loading]);

  const onDropFile = async (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    try {
      await uploadCommon(files);
      // refresh page
      // gotoDir(documentList[0]?.dirPath);
      gotoDir(getCurPath());
    } catch (e) {
      console.log(e)
    } finally {
      // clear files
      e.dataTransfer.clearData();
    }
  };

  // ========== click upload ==========
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onClickUploadBtn = (_e: React.MouseEvent<HTMLInputElement>) => {
    refFile.current?.click()
  };

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      await uploadCommon(files);
      // refresh page
      gotoDir(getCurPath());
    } catch (e) {
      console.log(e)
    } finally {
      // clear files
      e.target.value = '';
    }
  };

  // ========== check and delete ==========
  // ev?: React.FormEvent<HTMLInputElement | HTMLElement> | undefined,
  const onChangeCheck = (checked: boolean, index: number) => {
    updateChecked(index, checked);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onClickDelete = (_e: React.MouseEvent<Element>) => {
    setOpenDialog(true);
  };

  const onDeleteExec = async () => {
    try {
      const chkList = documentList.filter((item: any) => item.checked);
      const delList = chkList.map(item => item.key);
      await deleteData(delList);
      gotoDir(getCurPath());
      setOpenDialog(false);
    } catch (e) {

    } finally {

    }
  };

  // ========== click dir ==========
  const onClickDir = (e: React.MouseEvent<Element>, dirPath: string) => {
    console.log('go to dir:', dirPath);
    e.preventDefault();
    gotoDir(dirPath);
  };

  // ========== reload ==========
  const onClickReloadBtn = async (_e: React.MouseEvent<HTMLInputElement>) => {
    if (syncStatus.status === 1) return;
    setOpenReloadDialog(true);
  };

  const onReloadExec = async () => {
    try {
      await reloadData();
      setOpenReloadDialog(false);
      getSyncStatus();
    } catch (e) {

    } finally {
    }
  };


  return (
    <>
      <ModalDialog
        isOpen={openDialog}
        title="削除確認"
        onClose={() => {
          setOpenDialog(false);
        }}>
        <div>
          選択している項目を削除してもよろしいでしょうか？
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => { setOpenDialog(false); }} className="p-2 w-full bg-black text-white rounded-lg bg-aws-smile border flex items-center justify-centerp-1 px-3 hover:brightness-75">
            Cancel
          </Button>
          <Button
            onClick={onDeleteExec}
            className="p-2 w-full bg-black text-white rounded-lg bg-aws-smile border flex items-center justify-centerp-1 px-3 hover:brightness-75">
            削除
          </Button>
        </div>
      </ModalDialog>

      <ModalDialog
        isOpen={openReloadDialog}
        title="同期確認"
        onClose={() => {
          setOpenReloadDialog(false);
        }}>
        <div>
          ファイルを同期します。
          <p>*この処理には5分程度かかります</p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => { setOpenReloadDialog(false); }} className="p-2 w-full bg-black text-white rounded-lg bg-aws-smile border flex items-center justify-centerp-1 px-3 hover:brightness-75">
            Cancel
          </Button>
          <Button
            onClick={onReloadExec}
            className="p-2 w-full bg-black text-white rounded-lg bg-aws-smile border flex items-center justify-centerp-1 px-3 hover:brightness-75">
            OK
          </Button>
        </div>
      </ModalDialog>

      <div className="grid grid-cols-12 relative">
        {loading && <div className="absolute w-full h-full z-10 pt-20" style={{ backgroundColor: 'rgba(255,255,255,.8)' }}>
          <div className="grid grid-cols-1 justify-items-center gap-4">
            <Text className="mt-12 text-center">Loading...</Text>
            <Loader width="5rem" height="5rem" />
          </div>
        </div>}

        <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
          ドキュメント一覧
        </div>
        <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
          <Card>
            <div className="w-full text-center h-16 select-none" onDrop={onDropFile} onDragOver={(e) => { e.preventDefault(); }}>
              ここにドロップしてください。
            </div>
          </Card>
          <div className="flex justify-end mt-6 mb-3">
            {delBtnVisible && (
              <span className="cursor-pointer select-none mr-3" onClick={onClickDelete}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </span>
            )}
            <span className="cursor-pointer select-none mr-3" onClick={onClickUploadBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            <span className={"select-none " + (syncStatus.status === 1 ? "opacity-70 cursor-not-allowed" : "cursor-pointer")} onClick={onClickReloadBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </span>
            <input
              className="hidden"
              onChange={onChangeFile}
              aria-describedby="file_input_help"
              id="file_input"
              type="file"
              multiple
              accept=".csv, .doc, .docx, .md, .pdf, .ppt, .pptx, .tsv, .xlsx"
              ref={refFile}></input>
          </div>
          <div className="flex flex-center justify-between bg-gray-300 p-2 items-center font-bold">
            <div className="flex flex-center items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 fill-black stroke-white mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
              </svg>
              <span>/</span>
              {dirList?.map((dir: any, i: number) => {
                return (
                  <>
                    {dir.dirPath && (<a key={'dirname_' + i} href={dir.dirPath} className="mx-1 hover:text-blue-700" onClick={(e: React.MouseEvent<Element, MouseEvent>) => { onClickDir(e, dir.dirPath) }}>{dir.name}</a>)}
                    <span key={'slash_' + i}>/</span>
                  </>
                );
              })}
            </div>
            {syncStatus.status !== 0 && (<div className="whitespace-nowrap pr-2">{syncStatus.text}</div>)}
          </div>

          <Card>
            <table className="w-full">
              <tbody>
                {documentList?.map((data: any, index: number) => {
                  return (
                    <tr key={'tr_' + index}>
                      <td className="w-8">
                        {data.type !== 2 && (<Checkbox checked={data.checked} onChange={(_e, checked) => { onChangeCheck(checked || false, index) }}></Checkbox>)}
                      </td>
                      <td className="w-8">
                        {data.type !== 1 && (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>)}

                        {data.type === 1 && (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>)}
                      </td>
                      <td className="py-2">
                        {
                          data.type === 0 && (
                            <a href={`${data.dirPath}/${data.name}`} className="text-sky-600" onClick={(e: React.MouseEvent<Element, MouseEvent>) => { onClickDir(e, `${data.dirPath}/${data.name}`) }}>{data.name}</a>
                          )
                        }
                        {
                          data.type === 1 && (
                            <a className="text-sky-600">{data.name}</a>
                          )
                        }
                        {
                          data.type === 2 && (
                            <a href={data.dirPath} className="text-sky-600" onClick={(e: React.MouseEvent<Element, MouseEvent>) => { onClickDir(e, `${data.dirPath}/${data.name}`) }}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                              </svg>
                            </a>
                          )
                        }
                      </td>
                      <td className="w-40 pr-2">
                        <span className="whitespace-nowrap">{data.updateTime}</span>
                      </td>
                      <td className="w-16">
                        <span className="whitespace-nowrap">{data.size}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DocumentPage;
