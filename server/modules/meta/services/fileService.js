import multihash from 'multihashes';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import { fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { isB58, getStoragePath, checkFile, makeStorageDirs } from './helpers.js';
import searchIndex from 'search-index';


let index;

searchIndex(
  {
    indexPath: 'storage/index',
    logLevel: 'error',
  }, 
  (err, newIndex) => {
    if (!err) {
      index = newIndex;
    } else {
      console.log(err);
    }
  }
);

const writeFile = (stream, tempPathFile) => {
  return new Promise((resolve, reject) => {
    let dataSize = 0;
    let fail = false;
    if (fs.existsSync(tempPathFile)) fs.unlinkSync(tempPathFile);
    const file = fs.createWriteStream(tempPathFile, {flags: 'wx'});

    stream.pipe(file);

    const localError = (code) => {
      console.error(code);
      file.destroy();
      fail = true;
      fs.unlinkSync(tempPathFile);
      console.log(tempPathFile + ' - temporary file has been deleted');
      return reject(new AppError(406, code));
    };

    stream.on('data', (chunk) => {
        if (!fail) {
          dataSize += chunk.length;
          if (dataSize > fileSettings.uploadLimitSize) return localError(602);
        }
      });
    stream.on('close', ()=> {
        if (!fail) return localError(603);
      });

    file
      .on('error', (err) => {
        console.error(err);
        if (!fail) return localError(605);
      })
      .on('close', () => {
        if (!fail) {
          const tempFile = fs.readFileSync(tempPathFile);
          const dataHashHex = crypto.createHash('sha256').update(tempFile).digest('hex');
          const dataHashBuffer = multihash.fromHexString(dataHashHex);
          const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
          const multiHashB58 = multihash.toB58String(multiHashBuffer);
          let isJSON;
          try {
            const data = JSON.parse(tempFile);
            if (!data.title || !data.description) return localError(601);
            isJSON = true;
          } catch (e) {
            isJSON = false;
          }
          const metadataStoragePath = getStoragePath(multiHashB58, isJSON);
          if (!makeStorageDirs(metadataStoragePath, isJSON)) return localError(605);
          if (!fs.existsSync(metadataStoragePath)) {
            fs.renameSync(tempPathFile, metadataStoragePath);
            if (isJSON) {
              fs.createReadStream(metadataStoragePath)
                .pipe(index.feed())
                .on('error', () => {
                  console.log('error 1');
                })
                .on('finish', () => {
                  console.log('finish 1');
                });
            }
            return resolve(multiHashB58);
          } else {
            fs.unlinkSync(tempPathFile);
            return resolve(multiHashB58);
          }
        }
      });
  });
};

const readFiles = (stream, multiHashRequest) => {
  if (multiHashRequest.length==1) {
    const filePath = checkFile(multiHashRequest[0]);
    if (filePath) {
      return new Promise((resolve, reject) => {
        let file;
        if (filePath.indexOf('/json/')!=-1) {
          console.log('json');
          stream.writeHead(200, {'Content-Type': 'application/json'});
          file = fs.createReadStream(filePath, {encoding: 'utf-8'});
        } else {
          console.log('binary');
          stream.writeHead(200, {'X-Content-Type-Options': 'nosniff'});
          file = fs.createReadStream(filePath);
        }

        file
          .on('error', (err)=> {
            return (err.code == 'ENOENT')
              ? reject(new AppError(406, 606))
              : reject(new AppError(406, 605));
          })
          .pipe(stream);

        stream
          .on('close', () => {
            file.destroy();
            return reject(new AppError(406, 605));
          })
          .on('error', () => {
            return reject(new AppError(406, 605));
          })
          .on('finish', () => {
            stream.end();
          });
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      stream.writeHead(200, {
        'Content-Type': 'text/plain;charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      const form = new FormData();
      multiHashRequest.forEach((elem) => {
        if (isB58(elem)) {
          const metadataFile = checkFile(elem);
          form.append(elem,
            (metadataFile)
              ? fs.createReadStream(metadataFile, {encoding: 'utf-8'})
              : 'false'
          );
        } else {
          form.append(elem, 'false');
        }
      });

      form.on('error', (err)=> {
        console.error(err);
        reject(new AppError(406, 605));
      }).pipe(stream);

      stream
        .on('close', () => {
          form.destroy();
          reject(new AppError(406, 605));
        })
        .on('error', () => {
          reject(new AppError(406, 605));
        })
        .on('finish', () => {
          stream.end();
        });
    });
  }
};

const search = (text) => {
  return new Promise((resolve, reject) => {
    const searchResult = {};
    index.search(text)
      .on('data', (data) => {
        const dataHashHex = crypto.createHash('sha256').update(JSON.stringify(data.document)).digest('hex');
        const dataHashBuffer = multihash.fromHexString(dataHashHex);
        const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
        const multiHashB58 = multihash.toB58String(multiHashBuffer);
        const metadataStoragePath = getStoragePath(multiHashB58, true);
        if (fs.existsSync(metadataStoragePath)) searchResult[multiHashB58] = data.document;
      })
      .on('end', () => {
        return resolve(searchResult);
      });
  });
};

export {
  writeFile,
  readFiles,
  search,
};
