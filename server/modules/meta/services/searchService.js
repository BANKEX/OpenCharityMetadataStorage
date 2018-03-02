import multihash from 'multihashes';
import crypto from 'crypto';
import searchIndex from 'search-index';
import fs from 'fs';
import { DIRS } from 'configuration';
import { Readable } from 'stream';

let index;

const init = (callback) => {
  searchIndex(
    {
      indexPath: DIRS.storage + 'index',
      logLevel: 'error',
    },
    (err, newIndex) => {
      if (!err) {
        console.log('Index open');
        index = newIndex;
        if (callback) callback();
      } else {
        console.log(err);
      }
    }
  );
};

const search = (text) => {
  return new Promise((resolve, reject) => {
    const searchResult = {};
    index.search(text)
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('data', (data) => {
        const dataHashHex = crypto.createHash('sha256').update(JSON.stringify(data.document)).digest('hex');
        const dataHashBuffer = multihash.fromHexString(dataHashHex);
        const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
        const multiHashB58 = multihash.toB58String(multiHashBuffer);
        searchResult[multiHashB58] = data.document;
      })
      .on('end', () => {
        return resolve(JSON.stringify(searchResult));
      });
  });
};

const addFileIndex = (path) => {
  fs.createReadStream(path)
    .pipe(index.feed())
    .on('finish', () => {
      console.log(path + ' - indexed');
    });
};

const addJSONIndex = (obj) => {
  const stream = new Readable( {objectMode: true} );
  stream.push(obj);
  stream.push(null);
  stream
    .pipe(index.feed({ objectMode: true }))
    .on('finish', () => {
      console.log('Object - indexed');
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

init();

export {
  init,
  search,
  addFileIndex,
  addJSONIndex,
  close,
};
