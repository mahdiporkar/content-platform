export type StorageObjectRef = {
  bucket: string;
  key: string;
};

export interface StorageProvider {
  deleteObject(bucket: string, key: string): Promise<void>;
  deleteMany(objects: StorageObjectRef[]): Promise<void>;
}
