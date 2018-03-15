import { CAB } from 'configuration';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const getMetamapData = async (data) => {
  const options = {
    method: 'GET',
    uri: CAB + '/api/db/getMetamap',
  };
  try {
    return JSON.parse(await rp(options));
  } catch (e) {
    console.error(e.message);
  }
};

export {
  getMetamapData,
};
