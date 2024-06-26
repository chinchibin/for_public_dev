import { PrimaryKey } from './base';

export type PromptTemplate = {
  prefix: string;
  suffix: string;
  join: string;
  user: string;
  assistant: string;
  system: string;
  eosToken: string;
};

export type PromptAttributes = {
  uuid:string;
  title: string;
  content: string;
  type: string;
  updatedDate: string;
};

export type PromptPrimaryKey = {
  userId: string;
  createdDate:string;
};

export type RecordedPrompt = PromptPrimaryKey &
  PromptAttributes

export type ToBeRecordedPrompt =  {
  title: string;
  content: string;
  type: string;
};

export type UpdatePromptRequest = {
  userId: string;
  createdDate:string;
  uuid:string;
  content: string;
};
