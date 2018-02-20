const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const fs = require('fs');
const config = require('config');

const ADDRESS = config.get('address');
const DIRS = config.get('dirs');
const fileSettings = config.get('fileSettings');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = ADDRESS.external;

function isB58(multiHashB58) {
  if (typeof multiHashB58 !== 'string') return false;
  if (multiHashB58.length!=46) return false;
  if (multiHashB58.indexOf('Qm')!=0) return false;
  return true;
}

function getStoragePath(multiHashB58) {
  if (!isB58(multiHashB58)) return false;
  let metadataStoragePath = DIRS.storage + 'data/';
  let offset=0;
  fileSettings.dirSplit.forEach((elem) => {
    const cat = multiHashB58.slice(offset, elem+offset);
    metadataStoragePath += cat + '/';
    offset+=elem;
  });
  metadataStoragePath += multiHashB58.slice(offset);
  return metadataStoragePath;
}



describe('--------/api/meta/postData tests-----------', ()=> {
  it('POST новых метаданных', async()=> {
    let options = {
      method: 'POST',
      uri: mainURL + '/api/meta/postData/',
      body: 'вавыаыа%;№#<>sdf234dsdfjsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА'
    };
    const response = await rp.post(options);
    assert.equal(response, 'Qmcwu47WYf65x6SXLz2Z3nWhxQtfPPtzoPD2VHaJ6UCfRX');
  });

  it('Повторный POST метаданных', async()=> {
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
  it('GET запрос на ранее загруженный файл и его удаление', (done)=> {
    const hash = 'Qmcwu47WYf65x6SXLz2Z3nWhxQtfPPtzoPD2VHaJ6UCfRX';
    const requestPath = mainURL+'/api/meta/getData/'+hash;
    request(requestPath, (err, resp, body) => {
      if (err) return done(err);
      assert.equal(body, 'вавыаыа%;№#<>sdf234dsdfjsd83@#$%^&*()+_{}"?">M~`/+ sdfnewоплпЛАУЛАТУЛА');
      fs.unlinkSync(getStoragePath(hash), false);
      done();
    })
  });

  it('GET запрос на только что удаленный файл', (done)=> {
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
  it('POST двух новых файлов и GET мультизапрос', async ()=> {
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