import { deleteStorage, getStoragePath, revisionData } from '../../meta/services/fileService';

const deleteMetadataStorage = (data) => {
  return deleteStorage(data);
};

const getMetadataStoragePath = (data) => {
  return getStoragePath(data);
};

const revisionMetadata = async (data) => {
  return await revisionData(data);
};

const io = {
  revisionMetadata,
  getMetadataStoragePath,
  deleteMetadataStorage,
};

export default io;
