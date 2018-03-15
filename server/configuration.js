import config from 'config';

const ADDRESS = config.get('address');
const DIRS = config.get('dirs');
const CAB = config.get('cabinet');
const fileSettings = config.get('fileSettings');


export {
  ADDRESS,
  DIRS,
  CAB,
  fileSettings,
};
