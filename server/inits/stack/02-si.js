import { init, flush } from '../../modules/search/services/search-service';
import { Metamap } from '../../modules/search';

export default async () => {
  process.stdout.write('SearchIndex...');
  const intProcess = setInterval(() => process.stdout.write('.'), 200);
  await init();
  await flush();
  await Metamap.remove();
  clearInterval(intProcess);
  process.stdout.write('open\n');
};
