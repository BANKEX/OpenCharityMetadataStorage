import config from 'config';

const IP = process.env.IP || config.get('ip');
const PORT = process.env.PORT || config.get('port');
const JWT = config.get('jwt');
const DIRS = config.get('dirs');
const MONGO_URI = config.get('mongoURI');
const fileSettings = config.get('fileSettings');

export {
  IP,
  PORT,
  JWT,
  DIRS,
  fileSettings,
  MONGO_URI,
};
