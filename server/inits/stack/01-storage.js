import fs from 'fs';
import { DIRS } from 'configuration';

export default () => {
  if (!fs.existsSync(DIRS.storage)) fs.mkdirSync(DIRS.storage);
  const tempDIR = DIRS.storage + 'temp/';
  if (!fs.existsSync(tempDIR)) fs.mkdirSync(tempDIR);
};
