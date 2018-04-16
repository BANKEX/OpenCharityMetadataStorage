import rp from 'request-promise';
import fs from 'fs';
import { DIRS } from 'configuration';
import { getStoragePath, makeStorageDirs, getAttachHashes } from '../../modules/meta/services/helpers';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
});

const downloadFromStage = async (hash) => {
  const URL = 'https://meta.staging.bankex.team/api/meta/getData/';
  const downloadHash = async (hash, json) => {
    const load = await rp({
      method: 'GET',
      uri: URL+hash,
      encoding: (json) ? 'utf-8' : null,
    });
    const metadataStoragePath = getStoragePath(hash);
    makeStorageDirs(metadataStoragePath);
    if (!fs.existsSync(metadataStoragePath)) {
      fs.writeFileSync(metadataStoragePath, load);
      process.stdout.write('!');
    } else {
      process.stdout.write('*');
    }
    return (json) ? getAttachHashes(JSON.parse(load)) : null;
  };
  const attaches = await downloadHash(hash, true);
  await Promise.all(attaches.map(async (el) => (await downloadHash(el, false))));
};

export default async () => {
  process.stdout.write('Syncro with stage...');
  const int = setInterval(() => process.stdout.write('.'), 200);
  try {
    const revision = JSON.parse(await rp({
      method: 'GET',
      uri: 'https://meta.staging.bankex.team/api/meta/revision/long',
    }));
    for (let key in revision.storeJSON) {
      if (!revision.unusedJSON.includes(key) && !revision.unusedBinary.includes(key)) await downloadFromStage(key);
    }
    clearInterval(int);
    process.stdout.write('done\n');
  } catch (e) {
    clearInterval(int);
    process.stdout.write('crashed\n');
    throw e;
  }
};
