import multihash from 'multihashes';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import { fileSettings, DIRS } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { isB58, getStoragePath, checkFile, makeStorageDirs, getHashFromPath, getAttachHashes } from './helpers.js';
import { addJSONIndex, delIndex } from './searchService';
import { getMetamapData } from './metamapService';

const deleteFolderRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

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
            if (typeof parsed.searchDescription!='string' || typeof parsed.type!='string' || typeof parsed.data!='object') return localError(608);
            if (Object.getOwnPropertyNames(parsed.data).length==0) return localError(609);
            isJSON = true;
          } catch (e) {
            isJSON = false;
          }
          const dataHashHex = crypto.createHash('sha256').update(tempFile).digest('hex');
          const dataHashBuffer = multihash.fromHexString(dataHashHex);
          const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
          const multiHashB58 = multihash.toB58String(multiHashBuffer);
          const metadataStoragePath = getStoragePath(multiHashB58, isJSON);
          if (!metadataStoragePath) return localError(605);
          if (!makeStorageDirs(metadataStoragePath)) return localError(605);
          if (!fs.existsSync(metadataStoragePath)) {
            fs.renameSync(tempPathFile, metadataStoragePath);
            if (isJSON) {
              parsed.id = multiHashB58;
              addJSONIndex(parsed);
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

const deleteStorage = () => {
  deleteFolderRecursive(DIRS.storage + 'temp/');
  deleteFolderRecursive(DIRS.storage + 'data/');
  deleteFolderRecursive(DIRS.storage + 'index/');
  fs.mkdirSync(DIRS.storage + 'temp/');
  fs.mkdirSync(DIRS.storage + 'data/');
};

const researchData = (func, callback) => {
  let reindexBinary = 0;
  let reindexJSON = 0;

  const getFilePathRecursive = (path, callback) => {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file) => {
        const curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          getFilePathRecursive(curPath, callback);
        } else {
          try {
            const tempFile = fs.readFileSync(curPath);
            const obj = JSON.parse(tempFile);
            obj.id = getHashFromPath(curPath);
            reindexJSON++;
            callback(obj);
          } catch (e) {
            reindexBinary++;
            callback({ bin: getHashFromPath(curPath) });
          }
        }
      });
    }
  };

  reindexBinary = 0;
  reindexJSON = 0;
  getFilePathRecursive(DIRS.storage+'data/', func);
  console.log('reindexJSON='+reindexJSON);
  console.log('reindexBinary='+reindexBinary);
  if (callback) callback(reindexJSON, reindexBinary);
};

const deleteFile = (hash) => {
  const path = checkFile(hash);
  if (!path) throw new AppError(409, 600);
  fs.unlinkSync(path);
  delIndex(hash);
};

const updateMetadata = (oldHash, newHash) => {
  const oldPath = getStoragePath(oldHash);
  const newPath = getStoragePath(newHash);
  if (oldPath && newPath) {
    const oldFile = fs.readFileSync(oldPath);
    const newFile = fs.readFileSync(newPath);
    try {
      const oldData = JSON.parse(oldFile);
      const newData = JSON.parse(newFile);
      const oldAttachments = getAttachHashes(oldData);
      const newAttachments = getAttachHashes(newData);
      const noUseAttachments = oldAttachments.filter((hash) => (newAttachments.indexOf(hash)==-1));
      noUseAttachments.forEach(deleteFile);
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

    const db = await getMetamapData();
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
          const path = checkFile(hash);
          if (path) allUsedBinaryHashes.push(hash);
          return (path==false);
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

export {
  writeFile,
  readFiles,
  deleteFile,
  deleteStorage,
  researchData,
  updateMetadata,
  revisionData,
};
