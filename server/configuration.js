import config from 'config';

const ADDRESS = config.get('address');
const DIRS = config.get('dirs');
const CAB = config.get('cabinet');
const fileSettings = config.get('fileSettings');
const CORS = config.get('cors');


export {
  ADDRESS,
  DIRS,
  CAB,
  fileSettings,
  CORS,
};
