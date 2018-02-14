import fs from 'fs';
import { DIRS, fileSettings } from 'configuration';

function isB58(multiHashB58) {
  if (typeof multiHashB58 !== 'string') return false;
  if (multiHashB58.length!=46) return false;
  if (multiHashB58.indexOf('Qm')!=0) return false;
  return true;
}

function getStoragePath(multiHashB58, isJSON) {
  if (!isB58(multiHashB58)) return false;
  let metadataStoragePath = DIRS.storage;
  metadataStoragePath+= (isJSON) ? 'json/' : 'binary/';
  let offset=0;
  fileSettings.dirSplit.forEach((elem) => {
    const cat = multiHashB58.slice(offset, elem+offset);
    metadataStoragePath += cat + '/';
    offset+=elem;
  });
  metadataStoragePath += multiHashB58.slice(offset);
  return metadataStoragePath;
}

function makeStorageDirs(path, isJSON) {
  if (path.indexOf(DIRS.storage)!=0) return false;
  const storagePath = (isJSON) ? DIRS.storage + 'json/' : DIRS.storage + 'binary/';
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
}

function checkFile(multiHashB58) {
  if (!isB58(multiHashB58)) return false;
  const metadataStoragePathJSON = getStoragePath(multiHashB58, true);
  const metadataStoragePathBinary = getStoragePath(multiHashB58, false);
  return (fs.existsSync(metadataStoragePathJSON))
    ? metadataStoragePathJSON
    : (fs.existsSync(metadataStoragePathBinary)) 
      ? metadataStoragePathBinary
      : false;
}

export {
  isB58,
  getStoragePath,
  makeStorageDirs,
  checkFile,
};
