import searchIndex from 'search-index';
import { DIRS } from 'configuration';
import { Readable } from 'stream';
import path from 'path';

let index;
const addLine = [];
const delLine = [];
let readyToIndex = true;
let readyToDel = true;

const init = async () => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      appendOnly: false,
      indexPath: path.join(DIRS.storage, 'index'),
      logLevel: 'error',
    };
    const start = (err, newIndex) => {
      if (err) {
        reject(err);
      } else { 
        index = newIndex; 
        resolve();
      }
    };

    searchIndex(searchOptions, start);
  });
};

const search = (text) => {
  index.countDocs((err, count) => {
    console.log('this index contains ' + count + ' documents');
  });
  index.totalHits(text, (err, count) => {
    console.log('it gives ' + count + ' results');
  });
  return new Promise((resolve, reject) => {
    const searchResult = [];
    index.search(text)
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('data', (data) => {
        // console.log(data);
        if (!data.document) {
          console.log(data);
        } else {
          searchResult.push(data.document);
        }
      })
      .on('end', () => {
        return resolve(searchResult);
      });
  });
};

const close = () => {
  return new Promise((resolve, reject) => {
    index.close((err) => {
      if (err) reject(err);
      console.log('Index close');
      resolve(true);
    });
  });
};

const flush = () => {
  return new Promise((resolve, reject) => {
    index.flush((err) => {
      if (err) reject(err);
      // console.log('Index flushed');
      resolve();
    });
  });
};

const addBatchToLine = (data) => {
  const addIndex = () => {
    if (addLine.length) {
      readyToIndex = false;
      index.concurrentAdd({}, [addLine[0]], (err) => {
        if (err) console.error(err);
        addLine.shift();
        addIndex();
      });
    } else {
      readyToIndex = true;
    }
  };

  addLine.push(data);
  if (readyToIndex) addIndex();
};

const addBatchToDelLine = (data) => {
  const delIndex = () => {
    if (delLine.length) {
      readyToDel = false;
      index.concurrentDel([delLine[0]], (err) => {
        if (err) console.error(err);
        delLine.shift();
        delIndex();
      });
    } else {
      readyToDel = true;
    }
  };

  delLine.push(data);
  if (readyToDel) delIndex();
};

export {
  init,
  search,
  close,
  flush,
  addBatchToLine,
  addBatchToDelLine,
  readyToIndex,
  readyToDel,
};
