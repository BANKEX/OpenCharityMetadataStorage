import passport from 'koa-passport';
import pick from 'lodash.pick';
import jwt from 'jsonwebtoken';
import AppError from '../../../utils/errors.js';
import {JWT} from '../../../config.js';
import { User } from '../models';
import { UserService } from '../services';

function setToken(ctx, user) {
  const payload = {
    _id: user._id,
    exp: Math.floor(Date.now() / 1000) + JWT.exp,
  };
  const token = jwt.sign(payload, JWT.secret);
  ctx.cookies.set('jwt', token, {httpOnly: true});
  console.log(`${new Date().toLocaleString()} ${user.lastName} ${user.firstName} (${user.email}) signIn success!`);
  return token;
}

export default {
  async signup(ctx) {
    if (ctx.headers['content-type']!='application/json') throw new AppError(400, 10);
    if (ctx.user) throw new AppError(401, 102);

    const userData = pick(ctx.request.body, User.createFields);
    const { _id } = await UserService.createUser(userData);
    const user = await UserService.getUserWithPublicFields({ _id });

    ctx.status = 201;
    ctx.body = { data: user };
  },

  async login(ctx) {
    if (ctx.request.header['content-type']!='application/json') throw new AppError(400, 10);
    if (ctx.user) throw new AppError(401, 102);

    const { email, password } = ctx.request.body;
    if (!email || !password) throw new AppError(406, 601);
    await passport.authenticate('local', (err, user) => {
      if (err) throw (err);
      if (!user) throw new AppError(401, 100);
      ctx.body = { data: setToken(ctx, user) };
    })(ctx);
  },

  async logout(ctx) {
    if (!ctx.user) throw new AppError(401, 101);
    ctx.cookies.set('jwt', '', {httpOnly: true});
    ctx.headers.authorization = '';
    ctx.redirect('/');
  },

  async currentUser(ctx) {
    if (!ctx.user) throw new AppError(401, 101);
    const { user: { _id } } = ctx;
    const user = await UserService.getUserWithPublicFields({ _id });
    ctx.body = { data: user };
  },
  
  async changeUser(ctx) {
    if (!ctx.user) throw new AppError(401, 101);
    if (ctx.headers['content-type']!='application/json') throw new AppError(400, 10);
    const { user: { _id } } = ctx;
    const { password, newpassword } = ctx.request.body;
    const changeData = pick(ctx.request.body, User.changeFields);
    if (newpassword) {
      if (!password) throw new AppError(406, 601);
      if (!ctx.user.comparePasswords(password)) throw new AppError(401, 100);
      changeData['password'] = newpassword;
    }
    await UserService.updateUser(changeData, _id);
    const updated = await UserService.getUserWithPublicFields({ _id });
    ctx.body = { data: updated };
  },

  async forgotPassword(ctx) {
    if (!ctx.user) throw new AppError(401, 101);
    ctx.body = 'Ok';
  },
};
