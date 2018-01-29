const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const fs = require('fs');
const conDev = require('../../config/development.json');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

const mainURL = 'http://' + conDev.ip + ':' + conDev.port;
const DIR = conDev.dir;

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
      const file = fs.readFileSync(DIR + 'public/index.ejs', {encoding: 'utf-8'});
      assert.equal(body, file);
      done();
    });
  });

  it('HTML Ошибки при запросе /hello', (done)=> {
    request(mainURL+'/hello', (err, resp, body) => {
      if (err) return done(err);
      const index = body.indexOf('OpenCharity - Ошибка 404');
      assert.equal(index, 229);
      done();
    });
  });
});
