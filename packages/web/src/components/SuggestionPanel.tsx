import {useState ,useContext, useCallback  } from 'react';
// import styles from './SuggestionPanel.module.css'; // 引入样式文件
import { BaseProps } from '../@types/common';
import {AppStateContext } from "../state/AppProvider";

import Button from './Button';
import useDrawer from '../hooks/useDrawer';
import { useLocation } from 'react-router-dom';
import useChat from '../hooks/useChat';

import {
  RecordedPrompt,
} from 'generative-ai-use-cases-jp';
type Props = BaseProps & {
  recordedPrompts?: RecordedPrompt[];
  onUpdatePromptChange:(newItem: RecordedPrompt) => void;
};
export const SuggestionPanel: React.FC<Props>= (props) => {
  const { pathname } = useLocation()
  const { setInputing } = useChat(pathname)

  const {opened: isOpenDrawer } = useDrawer();
  const appStateContext = useContext(AppStateContext)
  const [expandeduuid, setExpandeduuid] = useState("");

  const addNewSuggestionItem = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_NEW_SUGGESTION' })
  };

  const showPrompt = (event:React.MouseEvent, uuid:string) => {
    event.preventDefault(); // 防止默认行为，根据需要添加
    if (expandeduuid === uuid) {
      setExpandeduuid("")
      return
    }
    setExpandeduuid(uuid);
  };
  // 编辑提示内容的方法
  const handlePromptEdit = (recordedPrompt:RecordedPrompt) => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_UPDATE_SUGGESTION' })
    props.onUpdatePromptChange(recordedPrompt);
  };


  const handlePromptAddContent = useCallback((recordedPrompt:RecordedPrompt) => {    
        setInputing(recordedPrompt.content);
    
    // navigate('/chat', {
    //   state: {
    //     systemContext: recordedPrompt.title,
    //     content: recordedPrompt.content,
    //   },
    //   replace: true,
    // });  
  }, [props]);

  return (
    <nav className={`top-20 z-20 transition-all fixed bg-aws-squid-ink lg:right-5 lg:z-0 overflow-y-auto flex w-64 flex-col text-sm text-black print:hidden ${isOpenDrawer ? 'right-0' : '-right-64'}`} style={{height: 'calc(100vh - 2.5rem)'}}>
      <div className='flex justify-center p-2'>
        <Button className="w-11/12" onClick={addNewSuggestionItem}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="fill-current w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>&nbsp;New Prompt
        </Button>
      </div>
      {props.recordedPrompts?.map((recordedPrompt) => (
        <div key={recordedPrompt.uuid} className={''}>
              <div key={recordedPrompt.uuid} > 
                  <div className='flex p-2 pl-5 pr-5' > 
                      <button onClick={(e) =>showPrompt(e, recordedPrompt.uuid)}  className={"flex m-auto  min-w-full"}> 
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 pr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                          </svg>
                          <div data-content="改改" >
                            {recordedPrompt.title} 
                          </div>
                      </button>
                      <button onClick={() =>handlePromptAddContent(recordedPrompt)} className={""}> 
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="tabler-icon tabler-icon-plus"> 
                              <path d="M12 5l0 14"></path> 
                              <path d="M5 12l14 0"></path> 
                          </svg> 
                      </button>
                  </div> 
                  {recordedPrompt.uuid === expandeduuid ? (
                    <div className={"bg-gray-50 ml-5 mr-3"}> 
                      <div> 
                          <pre className="whitespace-pre-wrap relative text-left rounded-lg pl-2 ">
                            {recordedPrompt.content}
                            <button onClick={() => handlePromptEdit(recordedPrompt)} className={"absolute right-0 "}> 
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"  className="tabler-icon tabler-icon-pencil w-5 h-5"> 
                              <path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4"></path> 
                              <path d="M13.5 6.5l4 4"></path> 
                            </svg>
                            </button> 
                          </pre>
                          {/* <input type="hidden"  value="on" />  */}
                      </div> 
                    </div>
                    ) : ("")
                  }
              </div> 
        </div>
      ))}
    </nav>
  );
}

export default SuggestionPanel;
