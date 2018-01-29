import { MONGO_URI } from '../../config.js';
import mongooseConnector from '../../services/mongoose-connector.js';
import server from '../../server.js';

export default async () => {
  try {
    await mongooseConnector(MONGO_URI);
  } catch (e) {
    console.log('Server has been closed');
    server.close();
  }
};
