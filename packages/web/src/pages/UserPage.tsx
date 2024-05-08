import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import useTyping from '../hooks/useTyping';
import { MODELS } from '../hooks/useModel';
import useUser from '../hooks/useUser';

import Card from '../components/Card';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import ModalDialog from '../components/ModalDialog';
// import UserDetailPage from '../components/UserDetailModal';
import { Checkbox } from '@fluentui/react'; // import  Checkbox  from '../components/Checkbox';
import { ChoiceGroup, TextField } from "@fluentui/react";


// type StateType = {
//   pageNo: number;
//   setPageNo: (c: number) => void;
// };
// const useUserPageState = create<StateType>((set) => {
//   return {
//     pageNo: '',
//     setPageNo: (n: number) => {
//       set(() => ({
//         pageNo: n,
//       }));
//     },
//   };
// });


const UserPage: React.FC = () => {
  // const { pageNo, setPageNo } = useUserPageState();
  const { pathname } = useLocation();
  const { userList, search } = useUser(pathname);

  const [openDialog, setOpenDialog] = useState(true);
  // const [dialogTitle, setDialogTitle] = useState("ユーザ詳細");

  const [itemBango, setItemBango] = useState("");
  const [bango, setBango] = useState("");
  const [email, setEmail] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>('0');
  const [pageNo, setPageNo] = useState<number>(1);

  const refFile = useRef<HTMLInputElement>(null);

  // ========== search ==========

  const options: IChoiceGroupOption[] = [
    [{ key: '0', text: '社員番号', iptDisabled: false }],
    [{ key: '1', text: 'メールアドレス', iptDisabled: true }],
  ];

  const onChange = React.useCallback((ev: React.SyntheticEvent<HTMLElement>, option: IChoiceGroupOption) => {
    setSelectedKey(option.key);
  }, []);


  const doSearch = () => {
    let data = {
      bango: String,
      email: String,
    };
    // selectedKey:0-社員番号, 1-email; value-入力値
    if (selectedKey === '0') {
      data.bango = bango;
    } else if (selectedKey === '1') {
      data.email = email;
    }
    search(data);
    console.log('search', data);
  }

  // ========== add / edit ==========

  const showDialog = (type: string, bango?: string) => {
    setOpenDialog(true);
    if (type === 'edit') {
      setItemBango(bango);
    }
    // setDialogTitle('');
  }


  // ========== pagination ==========

  const skipToPage = function (cur: number, e: React.MouseEvent<HTMLInputElement>) {
    setPageNo(cur);
  };

  return (
    <>
      {/* <UserDetailPage
        isOpen={openDialog}
        title="ユーザ詳細"
        bango={itemBango}
        onClose={() => {
          setOpenDialog(false);
        }}></UserDetailPage> */}
      <div className="grid grid-cols-12">
        <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
          ユーザ一覧
        </div>
        <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
          <div className="flex">
            <div className="mr-8">
              <ChoiceGroup
                options={options[0]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2">
                <TextField placeholder='社員番号' disabled={selectedKey !== '0'}
                  onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setBango(newValue) }} />
              </div>
            </div>
            <div>
              <ChoiceGroup
                options={options[1]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2">
                <TextField placeholder='メールアドレス' disabled={selectedKey === '0'}
                  onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setEmail(newValue) }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 mb-3">
            <span className="cursor-pointer select-none mr-3" onClick={doSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            <span className="cursor-pointer select-none" onClick={() => { showDialog('add') }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <td className="pl-2 w-2/12 h-10 border border-gray-300">社員番号</td>
                <td className="pl-2 border border-gray-300">メールアドレス</td>
                <td className="pl-2 w-2/12 border border-gray-300">ステータス</td>
                <td className="pl-2 w-2/12 border border-gray-300">ロール</td>
                <td className="pl-2 w-1/12 border border-gray-300"></td>
              </tr>
            </thead>
          </table>
          <div style={{ height: '500px' }} className="overflow-y-auto">
            <table className="w-full" style={{ marginTop: '-1px' }}>
              <tbody>
                {userList?.map((data: Object, index: Number) => {
                  return (
                    <tr key={'tr_' + index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                      <td className="pl-2 w-2/12 h-10 border border-gray-300">
                        {data.bango}
                      </td>
                      <td className="pl-2 border border-gray-300">
                        {data.email}
                      </td>
                      <td className="pl-2 w-2/12 border border-gray-300">
                        {data.status}
                      </td>
                      <td className="pl-2 w-2/12 border border-gray-300">
                        {data.role}
                      </td>
                      <td className="pl-2 w-1/12 border border-gray-300">
                        <span className="cursor-pointer select-none" onClick={() => { showDialog('edit', data.bango); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination sum={305} pageSize={0} pageNo={1} onSkipTo={skipToPage}></Pagination>
        </div>
      </div>
    </>
  );
};

export default UserPage;