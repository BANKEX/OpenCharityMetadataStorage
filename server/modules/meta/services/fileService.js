import multihash from 'multihashes';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import { fileSettings, DIRS, INTERVALS } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import io from '../io';
import path from 'path';

import { 
  isB58, 
  getStoragePath, 
  checkFile, 
  makeStorageDirs,
  getAttachHashes, 
  deleteFolderRecursive, 
  researchData,
} from './helpers.js';

const readFiles = (stream, multiHashRequest) => {
  if (multiHashRequest.length==1) {
    const filePath = checkFile(multiHashRequest[0]);
    if (filePath) {
      return new Promise((resolve, reject) => {
        const preFile = fs.readFileSync(filePath, {encoding: 'utf-8'});
        let isJSON;
        try {
          JSON.parse(preFile);
          isJSON = true;
        } catch (e) {
          isJSON = false;
        }
        let file;
        if (isJSON) {
          stream.writeHead(200, {'Content-Type': 'application/json'});
          file = fs.createReadStream(filePath, {encoding: 'utf-8'});
        } else {
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
        'Content-Type': 'text/plain; charset=utf-8',
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
          let isJSON;
          let parsed;
          try {
            parsed = JSON.parse(tempFile);
            if (parsed.searchDescription==undefined || !parsed.type || !parsed.data) return localError(607);
            if (typeof parsed.searchDescription!='string' || typeof parsed.data!='object') return localError(608);
            if (isNaN(Number(parsed.type))) return localError(608);
            if (!Number.isInteger(Number(parsed.type)) || Number(parsed.type)<0) return localError(608);
            if (Object.getOwnPropertyNames(parsed.data).length==0) return localError(609);
            isJSON = true;
          } catch (e) {
            isJSON = false;
          }
          const dataHashHex = crypto.createHash('sha256').update(tempFile).digest('hex');
          const dataHashBuffer = multihash.fromHexString(dataHashHex);
          const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
          const multiHashB58 = multihash.toB58String(multiHashBuffer);
          const metadataStoragePath = getStoragePath(multiHashB58);
          if (!metadataStoragePath) return localError(605);
          if (!makeStorageDirs(metadataStoragePath)) return localError(605);
          if (!fs.existsSync(metadataStoragePath)) {
            fs.renameSync(tempPathFile, metadataStoragePath);
            /*
            if (isJSON) {
              parsed.id = multiHashB58;
              io.addToIndex([parsed]);
            }
            */
            return resolve(multiHashB58);
          } else {
            fs.unlinkSync(tempPathFile);
            return resolve(multiHashB58);
          }
        }
      });
  });
};

const deleteFile = (hash) => {
  const pathFile = checkFile(hash);
  if (!pathFile) throw new AppError(409, 600);
  const stat = fs.statSync(pathFile);
  if (stat.ctime < Date.now() - INTERVALS.fs.deleteFileAfter) {
    fs.unlinkSync(pathFile);
    // io.delFromIndex(hash);
  }
};

const updateMetadata = (oldHash, newHash) => {
  const oldPath = checkFile(oldHash);
  const newPath = checkFile(newHash);
  if (oldPath && newPath) {
    const oldFile = fs.readFileSync(oldPath);
    const newFile = fs.readFileSync(newPath);
    try {
      const oldData = JSON.parse(oldFile);
      const newData = JSON.parse(newFile);
      const oldAttachments = getAttachHashes(oldData);
      const newAttachments = getAttachHashes(newData);
      const noUseAttachments = oldAttachments.filter((hash) => (!newAttachments.includes(hash)));
      // noUseAttachments.forEach(deleteFile);
      deleteFile(oldHash);
    } catch (e) {
      throw e;
    }
  } else {
    throw new AppError(409, 600);
  }
};

const revisionData = (type) => {
  return new Promise(async (resolve, reject) => {
    const rev = {
      missedBinary: [],
      missedJSON: [],
      unusedBinary: [],
      unusedJSON: [],
      statistic: {},
    };
    if (type == 'long') rev.storeJSON = {};
    if (type == 'deep') rev.wrongMultiHash = [];

    const allBinaryHashes = [];
    const allUsedBinaryHashes = [];

    const db = await io.getFromMetamap({});
    const metamapJSON = db.map((elem) => (elem.hash));
    rev.missedJSON = metamapJSON;

    const doWithEveryObject = (researchObject) => {
      if (researchObject.id) {
        const hash = researchObject.id;
        if (metamapJSON.indexOf(hash)==-1) {
          rev.unusedJSON.push(hash);
        } else {
          rev.missedJSON = rev.missedJSON.filter((el) => (hash != el));
        }
        const data = Object.assign({}, researchObject);
        delete data.id;
        const attachments = getAttachHashes(data);
        if (type == 'long') {
          rev.storeJSON[hash] = attachments;
        }
        const noExist = attachments.filter((hash) => {
          const pathFile = checkFile(hash);
          if (pathFile) allUsedBinaryHashes.push(hash);
          return (pathFile==false);
        });
        if (noExist.length>0) {
          const missedJSONbinary = {};
          missedJSONbinary[hash] = noExist;
          rev.missedBinary.push(missedJSONbinary);
        }
      } else {
        allBinaryHashes.push(researchObject.bin);
      }
      if (type == 'deep') {
        const hash = researchObject.id || researchObject.bin;
        const file = fs.readFileSync(getStoragePath(hash));
        const dataHashHex = crypto.createHash('sha256').update(file).digest('hex');
        const dataHashBuffer = multihash.fromHexString(dataHashHex);
        const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
        const multiHashB58 = multihash.toB58String(multiHashBuffer);
        if (multiHashB58!=hash) rev.wrongMultiHash.push(hash);
      }
    };

    const researchDataCallback = (jsons, binaries) => {
      rev.unusedBinary = allBinaryHashes.filter((hash) => (allUsedBinaryHashes.indexOf(hash)==-1));
      rev.statistic = {
        allJSON: jsons,
        allBinary: binaries,
        metamapJSONs: metamapJSON.length,
        missedJSONs: rev.missedJSON.length,
        unusedJSONs: rev.unusedJSON.length,
        missedBinaries: rev.missedBinary.length,
        unusedBinaries: rev.unusedBinary.length,
      };
      if (type == 'deep') rev.statistic.wrongMultiHash = rev.wrongMultiHash.length;
      resolve(rev);
    };

    researchData(doWithEveryObject, researchDataCallback);
  });
};

const deleteStorage = () => {
  deleteFolderRecursive(path.join(DIRS.storage, 'temp'));
  deleteFolderRecursive(path.join(DIRS.storage, 'data'));
  deleteFolderRecursive(path.join(DIRS.storage, 'index'));
  fs.mkdirSync(path.join(DIRS.storage, 'temp'));
  fs.mkdirSync(path.join(DIRS.storage, 'data'));
};

export {
  writeFile,
  readFiles,
  deleteFile,
  updateMetadata,
  revisionData,
  deleteStorage,
  getStoragePath,
  checkFile,
};
