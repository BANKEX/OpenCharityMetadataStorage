import config from 'config';

const ADDRESS = config.get('address');
const DIRS = config.get('dirs');
const MONGO_URI = config.get('mongoURI');
const DAPP = config.get('dapp');
const OC = config.get('opencharity');
const CAB = config.get('cabinet');
const INTERVALS = config.get('intervals');
const fileSettings = config.get('fileSettings');
const CORS = config.get('cors');

export {
  ADDRESS,
  DIRS,
  MONGO_URI,
  DAPP,
  OC,
  CAB,
  INTERVALS,
  fileSettings,
  CORS,
};
