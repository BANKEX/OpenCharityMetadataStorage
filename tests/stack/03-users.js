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

const user = {
  email: "mail"+Math.random(),
  password: "password",
  firstName: "qwe",
  lastName: "ewq"
};
const newPassword = 'newPassword';
const forgotPassword = 'forgotPassword';
let token, temptoken;


describe('--------Регистрация пользователя и изменение пароля-----------', () => {
  it('Регистрация нового пользователя', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/signup',
      body: JSON.stringify(user),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    const userCreated = JSON.parse(response).data;
    assert.equal(userCreated.email, userCreated.email.toLowerCase());
  });

  it('Повторная регистрация на тот же email', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/signup',
      body: JSON.stringify(user),
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
      body: JSON.stringify(user),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    token = JSON.parse(response).data;
    assert.equal(token.length, 172);
  });

  it('Пользователь меняет пароль', async () => {
    const data = {
      jwt : token,
      password: user.password,
      newpassword: newPassword
    };
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/change',
      body: JSON.stringify(data),
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    const response = await rp.post(options);
    const userUpdated = JSON.parse(response).data;
    assert.equal(userUpdated.email, userUpdated.email.toLowerCase());
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
});


describe('--------Вход с новым паролем, запрос данных о себе-----------', () => {
  it('Пользователь входит с новым паролем', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/login',
      body: JSON.stringify({ email: user.email, password: newPassword }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await rp.post(options);
    token = JSON.parse(response).data;
    assert.equal(token.length, 172);
  });

  it('Пользователь запрашивает данные о себе', async () => {
    const options = {
      method: 'GET',
      uri: mainURL + '/api/user',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : token
      }
    };
    const response = await rp(options);
    const userLoaded = JSON.parse(response).data;
    assert.equal(userLoaded.email, userLoaded.email.toLowerCase());
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
});


describe('--------Восстановление пароля, удаление пользователя-----------', () => {
  it('Пользователь забыл пароль', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/forgot',
      body: JSON.stringify({ email: user.email }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await rp.post(options);
    let boo = true;
    const link = JSON.parse(response).data;
    boo = link.indexOf(mainURL+'/api/user/setNewPassword?token=')==0 && boo;
    boo = link.replace(mainURL+'/api/user/setNewPassword?token=','').length==172 && boo;
    temptoken = (boo) ? link.replace(mainURL+'/api/user/setNewPassword?token=','') : '';
    assert.equal(boo, true);
  });

  it('Пользователь вводит пароль взамен забытому', async () => {
    if (temptoken) {
      const options = {
        method: 'POST',
        uri: mainURL + '/api/user/setNewPassword?token=' + temptoken,
        body: JSON.stringify({ password: forgotPassword }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await rp.post(options);
      assert.equal(response, 'Ok');
    }
  });

  it('Пользователь входит с восстановленным паролем', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/login',
      body: JSON.stringify({ email: user.email, password: forgotPassword }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await rp.post(options);
    token = JSON.parse(response).data;
    assert.equal(token.length, 172);
  });

  it('Пользователь удаляется', async () => {
    const options = {
      method: 'POST',
      uri: mainURL + '/api/user/delete',
      body: JSON.stringify({ password: forgotPassword }),
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : token
      }
    };
    try {
      await rp.post(options);
    } catch (e) {
      assert.equal(e.statusCode, 302);
    }
  });
});
