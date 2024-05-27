import React, { useMemo, useState } from 'react';
import { BaseProps } from '../@types/common';

// MEMO: 現在は Error しか実装していない
type Props = BaseProps & {
    sum: number;
    pageSize?: number;
    pageNo?: number,
    onSkipTo?: (pageNo: number, e: React.MouseEvent<HTMLInputElement>) => void;
};

const Pagination: React.FC<Props> = (props) => {

    const [pageNo, setPageNo] = useState<number>(props.pageNo || 1);

    const pageTotal = useMemo(() => {
        let { sum, pageSize } = props;
        pageSize = pageSize ? pageSize : 10;
        let pageTotal: number = Math.ceil(sum / pageSize);
        return pageTotal;
    }, [props.sum, props.pageSize]);

    let getPageRange = function (pageNo: number, pageSum: number) {
        pageNo = pageNo || 1;
        let start = 1, end = pageSum;
        let pageArr = [];  // 1 ...  4 5 6 7 8 9 10 11 12 13 ... 16

        if (pageSum > 9) {
            if (pageNo < 5) {
                end = 9;
            } else if (pageNo + 4 < pageSum) {
                end = pageNo + 4;
            }
            start = end - 8;
        }

        if (start === 2) {
            pageArr.push(1);
        } else if (start === 3) {
            pageArr.push(1);
            pageArr.push(2);
        } else if (start > 3) {
            pageArr.push(1);
            pageArr.push(0);
        }

        for (let i = start; i <= end; i++) {
            pageArr.push(i);
        }

        if (end === pageSum - 1) {
            pageArr.push(pageSum);
        } else if (end === pageSum - 2) {
            pageArr.push(pageSum - 1);
            pageArr.push(pageSum);
        } else if (end < pageSum - 2) {
            pageArr.push(0);
            pageArr.push(pageSum);
        }

        return pageArr;
    }

    let pageArr = getPageRange(pageNo, pageTotal);
    const skipTo = (pageNo: number, e: React.MouseEvent<HTMLInputElement>) => {
        if (pageNo < 1) pageNo = 1;
        else if (pageNo > pageTotal) pageNo = pageTotal;
        setPageNo(pageNo);
        props.onSkipTo && props.onSkipTo(pageNo, e);
    };

    return (
        <div className={"flex justify-end items-center text-center " + (props.sum > 0 ? '' : 'hidden')}>
            <span className="w-5 mx-1 cursor-pointer select-none hover:text-blue-700" onClick={(e: React.MouseEvent<HTMLInputElement>) => { skipTo(1, e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
                </svg>
            </span>
            <span className="w-5 mx-1 cursor-pointer select-none hover:text-blue-700" onClick={(e: React.MouseEvent<HTMLInputElement>) => { skipTo(pageNo - 1, e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
            </span>

            {
                pageArr.map((n, i) => {
                    let className = "w-5 mx-1 cursor-pointer select-none text-base hover:text-blue-700 hover:font-bold" + (n === pageNo ? " text-blue-600 font-bold" : "");
                    if (n !== 0) {
                        return <span key={'num_' + i} className={className} onClick={(e: React.MouseEvent<HTMLInputElement>) => { skipTo(n, e) }}>{n}</span>;
                    } else {
                        return <span key={'more_' + i} className="w-5 mx-1 select-none text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                        </span>;
                    }
                })
            }

            <span className="w-5 mx-1 cursor-pointer select-none hover:text-blue-700" onClick={(e: React.MouseEvent<HTMLInputElement>) => { skipTo(pageNo + 1, e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </span>
            <span className="w-5 mx-1 cursor-pointer select-none hover:text-blue-700" onClick={(e: React.MouseEvent<HTMLInputElement>) => { skipTo(pageTotal, e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
                </svg>
            </span>
        </div>
    );
};

export default Pagination;
