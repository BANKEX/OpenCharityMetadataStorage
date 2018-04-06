const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const fs = require('fs');
const config = require('config');
const path = require('path');

const ADDRESS = config.get('address');
const DIRS = {};
DIRS.main = path.resolve();
DIRS.public = path.resolve('public');
DIRS.storage = path.isAbsolute(config.get('dirs').storage)
  ? config.get('dirs').storage
  : path.resolve(config.get('dirs').storage);
const fileSettings = config.get('fileSettings');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = ADDRESS.external;


const isB58 = (multiHashB58) => {
  if (typeof multiHashB58 !== 'string') return false;
  if (multiHashB58.length!=46) return false;
  if (multiHashB58.indexOf('Qm')!=0) return false;
  return true;
};

const getStoragePath = (multiHashB58) => {
  if (!isB58(multiHashB58)) return false;
  let metadataStoragePath = path.join(DIRS.storage, 'data');
  let offset=0;
  fileSettings.dirSplit.forEach((elem) => {
    const cat = multiHashB58.slice(offset, elem+offset);
    metadataStoragePath = path.join(metadataStoragePath, cat);
    offset+=elem;
  });
  metadataStoragePath = path.join(metadataStoragePath, multiHashB58.slice(offset));
  return metadataStoragePath;
};



describe('--------/api/meta/postData tests-----------', ()=> {
  it('POST new metadata', async()=> {
    let options = {
      method: 'POST',
      uri: mainURL + '/api/meta/postData/',
      body: 'вавыаыа%;№#<>sdf234dsdfjsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА'
    };
    const response = await rp.post(options);
    assert.equal(response, 'Qmcwu47WYf65x6SXLz2Z3nWhxQtfPPtzoPD2VHaJ6UCfRX');
  });

  it('Repeat POST same metadata', async()=> {
    let options = {
      method: 'POST',
      uri: mainURL + '/api/meta/postData/',
      body: 'вавыаыа%;№#<>sdf234dsdfjsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА'
    };
    try {
      await rp.post(options)
    } catch(e) {
      assert.equal(e.status, 406);
    }
  });
});

describe('--------/api/meta/getData tests-----------', () => {
  it('GET previous test posted metadata and delete it', (done)=> {
    const hash = 'Qmcwu47WYf65x6SXLz2Z3nWhxQtfPPtzoPD2VHaJ6UCfRX';
    const requestPath = mainURL+'/api/meta/getData/'+hash;
    request(requestPath, (err, resp, body) => {
      if (err) return done(err);
      assert.equal(body, 'вавыаыа%;№#<>sdf234dsdfjsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА');
      fs.unlinkSync(getStoragePath(hash), false);
      done();
    })
  });

  it('GET previous test deleted metadata', (done)=> {
    const hash = 'Qmcwu47WYf65x6SXLz2Z3nWhxQtfPPtzoPD2VHaJ6UCfRX';
    const requestPath = mainURL+'/api/meta/getData/'+hash;
    request(requestPath, (err, resp, body) => {
      if (err) return done(err);
      assert.equal(resp.statusCode, 404);
      done();
    })
  });
});

describe('--------/api/meta/getData tests Multi-----------', () => {
  it('POST two new metadata, GET multirequest and delete them', async ()=> {
    const body = [
      'вавыаыа%;№#<>sdf234dsdfjsd83@',
      'jsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА'
    ];

    let options1 = {
      method: 'POST',
      uri: mainURL + '/api/meta/postData/',
      body: body[0]
    };
    let response1 = await rp.post(options1);

    let options2 = {
      method: 'POST',
      uri: mainURL + '/api/meta/postData/',
      body: body[1]
    };
    let response2 = await rp.post(options2);

    let optionsMain = {
      method: 'GET',
      uri: mainURL+'/api/meta/getData/'+response1+';'+response2
    };

    let main = await rp(optionsMain);
    fs.unlinkSync(getStoragePath(response1), false);
    fs.unlinkSync(getStoragePath(response2), false);
    let boo = true;
    boo = boo && main.indexOf(body[0])!=-1;
    boo = boo && main.indexOf(body[1])!=-1;
    boo = boo && (main.indexOf(body[0])<main.indexOf(body[1]));
    assert.equal(boo, true);

  });
});