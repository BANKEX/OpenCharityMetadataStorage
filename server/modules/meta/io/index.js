import { addBatchToLine, delIndex } from '../../search/services/search-service';
import { Metamap } from '../../search';

const addToIndex = async (data) => {
  return await addBatchToLine(data);
};

const delFromIndex = async (data) => {
  return await delIndex(data);
};

const getFromMetamap = async (data) => {
  return await Metamap.find(data).select({ _id: 0, __v: 0 });
};

const io = {
  addToIndex,
  delFromIndex,
  getFromMetamap,
};


export default io;
