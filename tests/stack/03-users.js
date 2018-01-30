const assert = require('assert');
const request = require('request');
const rp = require('request-promise');
const conDev = require('../../config/development.json');

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8'
});

const mainURL = conDev.address.protocol+'://' + conDev.address.ip + ':' + conDev.address.port;

const newUser = {
  email: "mail"+Math.random(),
  password: "password",
  firstName: "qwe",
  lastName: "ewq"
};
const newPassword = 'newPassword';
let token, newtoken;


describe('--------Тесты авторизации и изменений пользователя-----------', () => {
  it('Регистрация нового пользователя', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/signup',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    const user = JSON.parse(response).data;
    assert.equal(user.email, newUser.email.toLowerCase());
  });

  it('Повторная регистрация на тот же email', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/signup',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    try {
      await rp.post(options)
    } catch(e) {
      assert.equal(JSON.parse(e.error).status, 400);
    }
  });

  it('Логин пользователя', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/login',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    token = JSON.parse(response).data;
    assert.equal(token.length, 172);
  });

  it('Пользователь меняет пароль', async () => {
    const ext = {
      jwt : token,
      newpassword: newPassword
    };
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/change',
      body: JSON.stringify(Object.assign(newUser, ext)),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    const user = JSON.parse(response).data;
    assert.equal(user.email, newUser.email.toLowerCase());
  });

  it('Пользователь выходит', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/user/logout',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : token
      }
    };
    const response = await rp(options);
    assert.equal(response.indexOf('<!doctype html>'), 0);
  });

  it('Пользователь входит с новым паролем', async () => {
    const withNewPass = Object.assign({}, newUser);
    withNewPass.password = newPassword;
    delete withNewPass.jwt;
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/login',
      body: JSON.stringify(withNewPass),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await rp.post(options);
    let boo = true;
    newtoken = JSON.parse(response).data;
    boo = token != newtoken && boo;
    boo = newtoken.length==172 && boo;
    assert.equal(boo, true);
  });

  it('Пользователь запрашивает данные о себе', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/user',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : newtoken
      }
    };
    const response = await rp(options);
    const user = JSON.parse(response).data;
    assert.equal(user.email, newUser.email.toLowerCase());
  });

  it('Пользователь удаляется', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/delete',
      body: JSON.stringify({ password: newPassword }),
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : newtoken
      }
    };
    try {
      await rp.post(options);
    } catch (e) {
      assert.equal(e.statusCode, 302);
    }
  });
});
