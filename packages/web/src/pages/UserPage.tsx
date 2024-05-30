import React, { useState } from 'react';
import Pagination from '../components/Pagination';
import { ChoiceGroup, TextField } from "@fluentui/react";
import { Text, Loader } from '@aws-amplify/ui-react';
import useUser from '../hooks/useUser';

const UserPage: React.FC = () => {
  const { userList, search, sum, loading } = useUser();

  // const [openDialog, setOpenDialog] = useState(true);
  // const [dialogTitle, setDialogTitle] = useState("ユーザ詳細");
  // const [itemBango, setItemBango] = useState("");

  const [bango, setBango] = useState("");
  const [email, setEmail] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>('0');
  const [pageNo, setPageNo] = useState<number>(1);

  // ========== search ==========

  const options: any[] = [
    [{ key: '0', text: '社員番号', iptDisabled: false }],
    [{ key: '1', text: 'メールアドレス', iptDisabled: true }],
  ];

  const onChange = React.useCallback((_ev: any, option: any) => {
    setSelectedKey(option.key);
  }, []);

  const doSearch = (curPage: number) => {
    let data = {
      bango: '',
      email: '',
      page: curPage.toString(),
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
  // const showDialog = (type: string, bango?: string) => {
  //   setOpenDialog(true);
  //   if (type === 'edit') {
  //     setItemBango(bango || '');
  //   }
  // }

  // ========== pagination ==========
  const skipToPage = function (cur: number) {
    setPageNo(cur);
    doSearch(cur);
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
      <div className="grid grid-cols-12 relative">
        {loading && <div className="absolute w-full h-full z-10 pt-20" style={{ backgroundColor: 'rgba(255,255,255,.8)' }}>
          <div className="grid grid-cols-1 justify-items-center gap-4">
            <Text className="mt-12 text-center">Loading...</Text>
            <Loader width="5rem" height="5rem" />
          </div>
        </div>}
        <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
          ユーザ一覧
        </div>
        <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
          <div className="w-2/5">
            <div>
              <ChoiceGroup
                options={options[0]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2 ml-7">
                <TextField placeholder='社員番号' disabled={selectedKey !== '0'}
                  onChange={(_ev: any, newValue: any) => { setBango(newValue) }} />
              </div>
            </div>
            <div className="mt-3">
              <ChoiceGroup
                options={options[1]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2 ml-7">
                <TextField placeholder='メールアドレス' disabled={selectedKey === '0'}
                  onChange={(_ev: any, newValue: any) => { setEmail(newValue) }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 mb-3">
            <span className="cursor-pointer select-none mr-2" onClick={() => { skipToPage(1) }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            {/* <span className="cursor-pointer select-none ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </span> */}
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
          <div style={{ maxHeight: '500px' }} className="overflow-y-auto mb-4">
            <table className="w-full" style={{ marginTop: '-1px' }}>
              <tbody>
                {userList?.map((data: any, index: number) => {
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
                        <span className="cursor-pointer select-none">
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
          {sum > 0 && <Pagination sum={sum} pageSize={10} pageNo={pageNo} onSkipTo={skipToPage}></Pagination>}
        </div>
      </div>
    </>
  );
};

export default UserPage;