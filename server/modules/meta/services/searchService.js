import searchIndex from 'search-index';
import { DIRS } from 'configuration';
import { Readable } from 'stream';

let index;
const line = [];
let readyToIndex = true;

const init = (callback) => {
  const searchOptions = {
    appendOnly: false,
    indexPath: DIRS.storage + 'index',
    logLevel: 'error',
  };
  const start = (err, newIndex) => {
    if (!err) {
      console.log('Index open');
      index = newIndex;
      if (callback) callback();
    } else {
      console.log(err);
    }
  };
  
  searchIndex(searchOptions, start);
};

const search = (text) => {
  index.countDocs((err, count) => {
    console.log('this index contains ' + count + ' documents');
  });
  index.totalHits(text, (err, count) => {
    console.log('it gives ' + count + ' results');
  });
  return new Promise((resolve, reject) => {
    // const searchResult = {};
    const searchResult = [];
    index.search(text)
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('data', (data) => {
        /*
        const dataHashHex = crypto.createHash('sha256').update(JSON.stringify(data.document)).digest('hex');
        const dataHashBuffer = multihash.fromHexString(dataHashHex);
        const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
        const multiHashB58 = multihash.toB58String(multiHashBuffer);
        searchResult[multiHashB58] = data.document;
        */
        searchResult.push(data.document);
      })
      .on('end', () => {
        return resolve(JSON.stringify(searchResult));
      });
  });
};

const addBatchToLine = (data) => {
  line.push(data);
  if (readyToIndex) addJSONIndex();
};

const addJSONIndex = () => {
  if (line.length) {
    readyToIndex = false;
    const stream = new Readable({objectMode: true});
    let arr = false;
    if (Array.isArray(line[0])) {
      arr = true;
      line[0].forEach((el) => {
        stream.push(el);
      });
    } else {
      stream.push(line[0]);
    }
    stream.push(null);

    stream
      .pipe(index.defaultPipeline())
      .pipe(index.add({objectMode: true}))
      .on('finish', () => {
        console.log((arr) ? line[0].length+' array elements indexed' : 'Object - indexed');
        line.shift();
        addJSONIndex();
      });
  } else {
    readyToIndex = true;
  }
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

const delIndex = (id) => {
  return new Promise((resolve, reject) => {
    index.get([id])
      .on('data', (doc) => {
        index.del([id], (err) => {
          if (err) reject(err);
          console.log('deleted ' + id);
          resolve(true);
        });
      });
    setTimeout(()=>{
      resolve(false);
    }, 1000);
  });
};

const flush = () => {
  return new Promise((resolve, reject) => {
    index.flush((err) => {
      if (err) reject(err);
      console.log('Index flushed');
      resolve(true);
    });
  });
};

const getIndex = (id) => {
  return new Promise((resolve, reject) => {
    index.get([id])
      .on('data', (doc) => {
        resolve(doc);
      });
    setTimeout(()=>{
      resolve(false);
    }, 1000);
  });
};

init();

export {
  init,
  search,
  addBatchToLine,
  close,
  flush,
  delIndex,
  getIndex,
};
