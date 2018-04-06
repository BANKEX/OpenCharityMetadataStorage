import config from 'config';
import path from 'path';

const ADDRESS = config.get('address');
const DIRS = {};
DIRS.main = path.resolve();
DIRS.public = path.resolve('public');
DIRS.storage = path.isAbsolute(config.get('dirs').storage)
  ? config.get('dirs').storage
  : path.resolve(config.get('dirs').storage);

const MONGO_URI = config.get('mongoURI');
const DAPP = config.get('dapp');
const OC = config.get('opencharity');
const INTERVALS = config.get('intervals');
const fileSettings = config.get('fileSettings');
const CORS = config.get('cors');

export {
  ADDRESS,
  DIRS,
  MONGO_URI,
  DAPP,
  OC,
  INTERVALS,
  fileSettings,
  CORS,
};
