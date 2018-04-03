import fs from 'fs';
import { DIRS, fileSettings } from 'configuration';

const isB58 = (multiHashB58) => {
  if (typeof multiHashB58 !== 'string') return false;
  if (multiHashB58.length!=46) return false;
  if (multiHashB58.indexOf('Qm')!=0) return false;
  return true;
};

const getHashFromPath = (path) => {
  const hashSlash = path.replace(DIRS.storage + 'data/', '');
  return hashSlash.replace(/\//g, '');
};

const getStoragePath = (multiHashB58) => {
  if (!isB58(multiHashB58)) return false;
  let metadataStoragePath = DIRS.storage + 'data/';
  let offset=0;
  fileSettings.dirSplit.forEach((elem) => {
    const cat = multiHashB58.slice(offset, elem+offset);
    metadataStoragePath += cat + '/';
    offset+=elem;
  });
  metadataStoragePath += multiHashB58.slice(offset);
  return metadataStoragePath;
};

const makeStorageDirs = (path) => {
  if (path.indexOf(DIRS.storage)!=0) return false;
  const storagePath = DIRS.storage + 'data/';
  const metadataPathArray = path.replace(storagePath, '').split('/');
  if (!isB58(metadataPathArray.join(''))) return false;
  let noFail = true;
  metadataPathArray.forEach((elem, index) => {
    if (index != metadataPathArray.length-1) {
      noFail = noFail && (elem.length == fileSettings.dirSplit[index]);
    }
  });
  if (noFail) {
    let makePath = storagePath;
    metadataPathArray.forEach((elem, index) => {
      if (index != metadataPathArray.length-1) {
        makePath += elem+'/';
        if (!fs.existsSync(makePath)) fs.mkdirSync(makePath);
      }
    });
    return true;
  } else return false;
};

const checkFile = (multiHashB58) => {
  if (!isB58(multiHashB58)) return false;
  const metadataStoragePath = getStoragePath(multiHashB58);
  return (fs.existsSync(metadataStoragePath))
    ? metadataStoragePath
    : false;
};

const getAttachHashes = (obj) => {
  let arr = [];
  Object.getOwnPropertyNames(obj).forEach((key) => {
    if (typeof obj[key] == 'object') arr = arr.concat(getAttachHashes(obj[key]));
    if (key == 'storageHash') {
      arr.push(obj[key]);
    }
  });
  return arr;
};

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
  
  getFilePathRecursive(DIRS.storage+'data/', func);
  // console.log('reindexJSON='+reindexJSON);
  // console.log('reindexBinary='+reindexBinary);
  if (callback) callback(reindexJSON, reindexBinary);
};


export {
  isB58,
  getStoragePath,
  makeStorageDirs,
  checkFile,
  getHashFromPath,
  getAttachHashes,
  deleteFolderRecursive,
  researchData,
};
