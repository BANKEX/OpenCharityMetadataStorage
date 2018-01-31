import fs from 'fs';
import { DIRS } from 'configuration';

export default () => {
  const storageDIR = DIRS.main + DIRS.storage;
  if (!fs.existsSync(storageDIR)) fs.mkdirSync(storageDIR);
  const tempDIR = storageDIR + 'temp/';
  if (!fs.existsSync(tempDIR)) fs.mkdirSync(tempDIR);
};
