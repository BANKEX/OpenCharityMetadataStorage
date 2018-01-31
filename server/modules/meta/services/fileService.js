import multihash from 'multihashes';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import {fileSettings} from 'configuration.js';
import AppError from 'AppErrors';
import {isB58, getStoragePath, checkFile, makeStorageDirs} from './helpers.js';


function writeFile(stream, tempPathFile) {
  return new Promise((resolve, reject) => {
    let dataSize = 0;
    let fail = false;
    let dataHashing;
    if (fs.existsSync(tempPathFile)) fs.unlinkSync(tempPathFile);
    const file = new fs.WriteStream(tempPathFile, {flags: 'wx'});
    stream.pipe(file);

    const localError = (code) => {
      file.destroy();
      fail = true;
      dataHashing = undefined;
      fs.unlinkSync(tempPathFile);
      console.log(tempPathFile + ' - temporary file has been deleted');
      return reject(new AppError(406, code));
    };

    stream.on('data', (chunk) => {
      if (!fail) {
        dataSize += chunk.length;
        (!dataHashing)
          ? dataHashing = chunk
          : dataHashing += chunk;
        if (dataSize > fileSettings.uploadLimitSize && !fail) localError(602);
      }
    });

    stream.on('close', ()=> {
      if (!fail) localError(603);
    });

    file.on('error', (err) => {
      console.error(err);
      if (!fail) localError(605);
    });

    file.on('close', () => {
      if (!fail) {
        const dataHashHex = crypto.createHash('sha256').update(dataHashing).digest('hex');
        const dataHashBuffer = multihash.fromHexString(dataHashHex);
        const multiHashBuffer = multihash.encode(dataHashBuffer, 'sha2-256');
        const multiHashB58 = multihash.toB58String(multiHashBuffer);
        dataHashing = undefined;
        const metadataStoragePath = getStoragePath(multiHashB58);
        if (!makeStorageDirs(metadataStoragePath)) localError(605);
        if (!fs.existsSync(metadataStoragePath)) {
          fs.renameSync(tempPathFile, metadataStoragePath);
          resolve(multiHashB58);
        } else {
          fs.unlinkSync(tempPathFile);
          resolve(multiHashB58);
        }
      }
    });
  });
}

function readFiles(stream, multiHashRequest) {
  if (multiHashRequest.length==1) {
    const filePath = checkFile(multiHashRequest[0]);
    if (filePath) {
      return new Promise((resolve, reject) => {
        stream.writeHead(200, {
          'Content-Type': 'text/plain;charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        const file = fs.createReadStream(filePath, {encoding: 'utf-8'});

        file.on('error', (err)=> {
          console.error(err);
          if (err.code == 'ENOENT') {
            reject(new AppError(406, 606));
          } else {
            reject(new AppError(406, 605));
          }
        }).pipe(stream);

        stream
          .on('close', () => {
            file.destroy();
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
}

export {
  writeFile,
  readFiles,
};
