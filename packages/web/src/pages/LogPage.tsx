import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import useTyping from '../hooks/useTyping';
import { MODELS } from '../hooks/useModel';
import useLog from '../hooks/useLog';

import Card from '../components/Card';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import ModalDialog from '../components/ModalDialog'
import { Checkbox } from '@fluentui/react'; // import  Checkbox  from '../components/Checkbox';
import { ChoiceGroup, TextField } from "@fluentui/react";


// type StateType = {
//   pageNo: number;
//   setPageNo: (c: number) => void;
// };
// const useLogPageState = create<StateType>((set) => {
//   return {
//     pageNo: '',
//     setPageNo: (n: number) => {
//       set(() => ({
//         pageNo: n,
//       }));
//     },
//   };
// });


const LogPage: React.FC = () => {
  // const { pageNo, setPageNo } = useLogPageState();
  const { pathname } = useLocation();
  const { logList, search } = useLog(pathname);

  const [openDialog, setOpenDialog] = useState(true);
  // const [dialogTitle, setDialogTitle] = useState("ユーザ詳細");

  const [itemBango, setItemBango] = useState("");
  const [torokuDt, setTorokuDt] = useState("");
  const [bango, setBango] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>('0');
  const [selectedSubKey, setSelectedSubKey] = useState<string | undefined>('0');
  const [pageNo, setPageNo] = useState<number>(1);

  const refFile = useRef<HTMLInputElement>(null);

  // ========== search ==========

  const subOptions: IChoiceGroupOption[] = [
    [{ key: '0', text: '' }],
    [{ key: '1', text: '' }],
  ];


  const onChangeSub = React.useCallback((ev: React.SyntheticEvent<HTMLElement>, option: IChoiceGroupOption) => {
    setSelectedSubKey(option.key);
  }, []);


  const options: IChoiceGroupOption[] = [
    [{ key: '0', text: '登録日時', iptDisabled: false }],
    [{ key: '1', text: '利用者', iptDisabled: true }],
    [{ key: '2', text: 'コンテンツ', iptDisabled: true }],
  ];

  const onChange = React.useCallback((ev: React.SyntheticEvent<HTMLElement>, option: IChoiceGroupOption) => {
    setSelectedKey(option.key);
  }, []);


  const doSearch = () => {
    let data = {
      torokuDt: String,
      bango: String,
      email: String,
      content: String
    };
    // selectedKey:0-社員番号, 1-email; value-入力値
    if (selectedKey === '0') {
      data.torokuDt = torokuDt;
    } else if (selectedKey === '2') {
      data.content = content;
    } else if (selectedKey === '1' && selectedSubKey === '0') {
      data.bango = bango;
    } else if (selectedKey === '1' && selectedSubKey === '1') {
      data.email = email;
    }
    search(data);
    console.log('search', data);
  }

  // ========== pagination ==========

  const skipToPage = function (cur: number, e: React.MouseEvent<HTMLInputElement>) {
    setPageNo(cur);
  };

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
          利用ログ一覧
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
                <TextField placeholder='前方一致検索' disabled={selectedKey !== '0'}
                  onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setTorokuDt(newValue) }} />
              </div>
            </div>
            <div>
              <ChoiceGroup
                options={options[1]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="flex align-center pt-2 ml-7">
                <div className="flex">
                  <ChoiceGroup
                    options={subOptions[0]}
                    selectedKey={selectedSubKey}
                    onChange={onChangeSub}
                    style={{ marginTop: '-8px' }}
                    disabled={selectedKey !== '1'}
                  />
                  <TextField placeholder='社員番号' disabled={!(selectedKey === '1' && selectedSubKey === '0')} className="ml-1"
                    onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setBango(newValue) }} />
                </div>
                <div className="flex ml-6">
                  <ChoiceGroup
                    options={subOptions[1]}
                    selectedKey={selectedSubKey}
                    onChange={onChangeSub}
                    style={{ marginTop: '-8px' }}
                    disabled={selectedKey !== '1'}
                  />
                  <TextField placeholder='メールアドレス' disabled={!(selectedKey === '1' && selectedSubKey === '1')} className="ml-1"
                    onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setEmail(newValue) }} />
                </div>
              </div>
            </div>
            <div>
              <ChoiceGroup
                options={options[2]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2 ml-7">
                <TextField placeholder='部分一致検索' disabled={selectedKey !== '2'}
                  onChange={(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => { setContent(newValue) }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 mb-3">
            <span className="cursor-pointer select-none" onClick={doSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <td className="pl-2 h-10 border border-gray-300" style={{ width: '180px' }}>登録日時</td>
                <td className="pl-2 border border-gray-300" style={{ width: '90px' }}>社員番号</td>
                <td className="pl-2 border border-gray-300" style={{ width: '270px' }}>メールアドレス</td>
                <td className="pl-2 border border-gray-300">コンテンツ</td>
              </tr>
            </thead>
          </table>
          <div style={{ height: '500px' }} className="overflow-y-auto mb-4">
            <table className="w-full" style={{ marginTop: '-1px' }}>
              <tbody>
                {logList?.map((data: Object, index: Number) => {
                  return (
                    <tr key={'tr_' + index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                      <td className="pl-2 border border-gray-300" style={{ width: '180px' }}>
                        {data.createdTime}
                      </td>
                      <td className="pl-2 h-10 border border-gray-300" style={{ width: '90px' }}>
                        {data.bango}
                      </td>
                      <td className="pl-2 border border-gray-300" style={{ width: '270px' }}>
                        {data.email}
                      </td>
                      <td className="p-2 border border-gray-300 whitespace-pre-wrap">
                        {data.content}
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

export default LogPage;