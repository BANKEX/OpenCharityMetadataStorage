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
  encoding: 'utf-8',
});

const mainURL = ADDRESS.protocol+'://' + ADDRESS.ip + ':' + ADDRESS.port;

describe('--------Common tests-----------', ()=> {
  it('Сервер отвечает на запросы', (done)=> {
    request(mainURL, (err, resp, body) => {
      if (err) return done(err);
      assert.equal(resp.statusCode, 200);
      done();
    });
  });

  it('Корректно отдает index.ejs', (done)=> {
    request(mainURL, (err, resp, body) => {
      if (err) return done(err);
      const file = fs.readFileSync(DIRS.public + '/index.ejs', {encoding: 'utf-8'});
      assert.equal(body, file);
      done();
    });
  });

  it('HTML Ошибки при запросе /hello', (done)=> {
    request(mainURL+'/hello', (err, resp, body) => {
      if (err) return done(err);
      assert.equal(resp.statusCode, 404);
      done();
    });
  });
});
