import React, { useState } from 'react';
import useLog from '../hooks/useLog';

import Pagination from '../components/Pagination';
import { Text, Loader } from '@aws-amplify/ui-react';
import { ChoiceGroup, TextField } from "@fluentui/react";

const LogPage: React.FC = () => {
  const { logList, search, loading, sum } = useLog();

  const [torokuDt, setTorokuDt] = useState("");
  const [bango, setBango] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>('0');
  const [selectedSubKey, setSelectedSubKey] = useState<string | undefined>('0');
  const [pageNo, setPageNo] = useState<number>(1);

  // ========== search ==========

  const subOptions: any[] = [
    [{ key: '0', text: '' }],
    [{ key: '1', text: '' }],
  ];


  const onChangeSub = React.useCallback((_ev: any, option: any) => {
    setSelectedSubKey(option.key);
  }, []);


  const options: any[] = [
    [{ key: '0', text: '登録日時', iptDisabled: false }],
    [{ key: '1', text: '利用者', iptDisabled: true }],
    [{ key: '2', text: 'コンテンツ', iptDisabled: true }],
  ];

  const onChange = React.useCallback((_ev: any, option: any) => {
    setSelectedKey(option.key);
  }, []);


  const doSearch = (curPage: number) => {
    const data = {
      torokuDt: '',
      bango: '',
      email: '',
      content: '',
      page: curPage.toString(),
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
  }

  // ========== pagination ==========

  const skipToPage = function (cur: number) {
    setPageNo(cur);
    doSearch(cur);
  };

  return (
    <>
      <div className="grid grid-cols-12 relative">
        {loading && <div className="absolute w-full h-full z-10 pt-20" style={{ backgroundColor: 'rgba(255,255,255,.8)' }}>
          <div className="grid grid-cols-1 justify-items-center gap-4">
            <Text className="mt-12 text-center">Loading...</Text>
            <Loader width="5rem" height="5rem" />
          </div>
        </div>}

        <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
          利用ログ一覧
        </div>
        <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
          <div className="w-4/5">
            <div>
              <ChoiceGroup
                options={options[0]}
                selectedKey={selectedKey}
                onChange={onChange}
              />
              <div className="pt-2 ml-7">
                <TextField placeholder='前方一致検索' disabled={selectedKey !== '0'}
                  onChange={(_ev: any, newValue: any) => { setTorokuDt(newValue) }} />
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
                    onChange={(_ev: any, newValue: any) => { setBango(newValue) }} />
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
                    onChange={(_ev: any, newValue: any) => { setEmail(newValue) }} />
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
                  onChange={(_ev: any, newValue: any) => { setContent(newValue) }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 mb-3">
            <span className="cursor-pointer select-none" onClick={()=>{skipToPage(1)}}>
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
          <div style={{ maxHeight: '500px' }} className="overflow-y-auto mb-4">
            <table className="w-full" style={{ marginTop: '-1px' }}>
              <tbody>
                {logList?.map((data: any, index: number) => {
                  return (
                    <tr key={'tr_' + index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                      <td className="pl-2 border border-gray-300" style={{ width: '180px' }}>
                        {data.torokuDt}
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
          <Pagination sum={sum} pageSize={10} pageNo={pageNo} onSkipTo={skipToPage}></Pagination>
        </div>
      </div>
    </>
  );
};

export default LogPage;