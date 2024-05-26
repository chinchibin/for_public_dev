export type S3ObjectPath = {
  prefix: string;
  
};


export type S3Object = {
  key: string;
  lastModified: string;
  
};


export type DeleteS3ObjectPrefix = {
  prefixes: string[],
}

export type DataSourceSyncStatus = {
  status: string,
}