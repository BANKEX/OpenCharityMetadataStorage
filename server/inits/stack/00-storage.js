import fs from 'fs';
import { DIRS } from 'configuration';

export default () => {
  if (!fs.existsSync(DIRS.storage)) fs.mkdirSync(DIRS.storage);
  const tempDIR = DIRS.storage + 'temp/';
  const dataDIR = DIRS.storage + 'data/';
  if (!fs.existsSync(tempDIR)) fs.mkdirSync(tempDIR);
  if (!fs.existsSync(dataDIR)) fs.mkdirSync(dataDIR);
};
