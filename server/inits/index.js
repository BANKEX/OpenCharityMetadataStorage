import storage from './stack/00-storage';
import mongo from './stack/01-mongo';
import si from './stack/02-si';
import dappAll from './stack/03-dappAll';
import revisionAndRecover from './stack/04-rr';
import server from 'server';

export default async () => {
  return new Promise(async (resolve, reject) => {
    try {
      storage();
      await mongo();
      await si();
      await dappAll();
      // await revisionAndRecover();
      resolve();
    } catch (e) {
      console.log(e);
      console.log('Server has been closed');
      server.close();
      reject();
    }
  });
};
