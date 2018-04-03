import { MONGO_URI } from 'configuration';
import mongooseConnector from '../../services/mongoose-connector.js';

export default async () => {
  process.stdout.write('MongoDB...');
  const intProcess = setInterval(() => process.stdout.write('.'), 200);
  await mongooseConnector(MONGO_URI);
  clearInterval(intProcess);
  process.stdout.write('connected\n');
};
