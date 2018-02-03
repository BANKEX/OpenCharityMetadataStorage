import config from 'config';

const ADDRESS = config.get('address');
const DIRS = config.get('dirs');
const fileSettings = config.get('fileSettings');


export {
  ADDRESS,
  DIRS,
  fileSettings,
};
