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
  return JSON.parse(await rp(options));
};

const initDonators = async () => {
  const options = {
    method: 'POST',
    uri: CAB + '/api/db/dropOrgs',
    body: JSON.stringify({password: 'organ'}),
    headers: {'Content-Type': 'application/json'},
  };
  await rp.post(options);
};


export {
  getMetamapData,
  initDonators,
};
