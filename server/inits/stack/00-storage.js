import fs from 'fs';
import { DIRS } from 'configuration';
import path from 'path';

export default () => {
  if (!fs.existsSync(DIRS.storage)) fs.mkdirSync(DIRS.storage);
  const tempDIR = path.join(DIRS.storage, 'temp/');
  const dataDIR = path.join(DIRS.storage, 'data/');
  if (!fs.existsSync(tempDIR)) fs.mkdirSync(tempDIR);
  if (!fs.existsSync(dataDIR)) fs.mkdirSync(dataDIR);
};
