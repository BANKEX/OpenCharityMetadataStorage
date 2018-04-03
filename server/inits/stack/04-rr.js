import { revisionData, getStoragePath, deleteFile } from '../../modules/meta/services/fileService';
import { addBatchToLine, readyToIndex } from '../../modules/search/services/search-service';
import fs from 'fs';

export default async () => {
  process.stdout.write('IndexMeta...');
  const intProcess = setInterval(() => process.stdout.write('.'), 200);
  const revision = await revisionData('long');
  const storedJSONs = Object.getOwnPropertyNames(revision.storeJSON);
  // const usedJSONs = storedJSONs.filter((el) => (revision.unusedJSON.indexOf(el)==-1));
  storedJSONs.forEach((hash) => {
    const path = getStoragePath(hash);
    const file = fs.readFileSync(path);
    const obj = JSON.parse(file);
    obj.id = hash;
    addBatchToLine([obj]);
  });
  clearInterval(intProcess);
  await new Promise((resolve) => {
    let twice = false;
    const intProcess = setInterval(() => {
      process.stdout.write('.');
      if (readyToIndex) {
        if (twice) {
          clearInterval(intProcess);
          process.stdout.write('done\n');
          resolve();
        } else {
          twice = true;
        }
      } else {
        twice = false;
      }
    }, 500);
  });
  /*
  process.stdout.write('Recovering...');
  revision.unusedJSON.forEach((hash) => {
    deleteFile(hash);
    process.stdout.write('.');
  });
  revision.unusedBinary.forEach((hash) => {
    deleteFile(hash);
    process.stdout.write('.');
  });
  process.stdout.write('done\n');
  */
};
