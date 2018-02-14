import fs from 'fs';
import { DIRS } from 'configuration';

export default () => {
  if (!fs.existsSync(DIRS.storage)) fs.mkdirSync(DIRS.storage);
  const tempDIR = DIRS.storage + 'temp/';
  const jsonDIR = DIRS.storage + 'json/';
  const binaryDIR = DIRS.storage + 'binary/';
  if (!fs.existsSync(tempDIR)) fs.mkdirSync(tempDIR);
  if (!fs.existsSync(jsonDIR)) fs.mkdirSync(jsonDIR);
  if (!fs.existsSync(binaryDIR)) fs.mkdirSync(binaryDIR);
};
