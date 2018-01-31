import passport from 'koa-passport';
import pick from 'lodash.pick';
import jwt from 'jsonwebtoken';
import AppError from 'AppErrors.js';
import {JWT, ADDRESS} from 'configuration';
import { User } from '../models';
import { UserService } from '../services';

function setToken(ctx, user) {
  const payload = {
    _id: user._id,
    exp: Math.floor(Date.now() / 1000) + JWT.exp,
  };
  const token = jwt.sign(payload, JWT.secret);
  ctx.cookies.set('jwt', token, {httpOnly: true});
  // console.log(`${new Date().toLocaleString()} ${user.lastName} ${user.firstName} (${user.email}) signIn success!`);
  return token;
}

export default {
  async signup(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.user) throw new AppError(401, 102);

    const userData = pick(ctx.request.body, User.createFields);
    const { _id } = await UserService.createUser(userData);
    const user = await UserService.getUserWithPublicFields({ _id });

    ctx.status = 201;
    ctx.body = { data: user };
  },

  async login(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
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

  async forgotPassword(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.user) throw new AppError(401, 102);
    
    const { email } = ctx.request.body;
    if (!email) throw new AppError(406, 601);
    const user = await User.findOne({ email });
    if (!user) throw new AppError(406, 104);
    const tempToken = await UserService.setTempToken(user._id);
    const tempLink = `${ADDRESS.protocol}://${ADDRESS.ip}:${ADDRESS.port}/api/user/setNewPassword?token=${tempToken}`;
    // send email to user.email with tempLink
    ctx.body = { data: tempLink };
  },

  async setNewPasswordData(ctx) {
    if (ctx.user) throw new AppError(401, 102);
    try {
      jwt.verify(ctx.query.token, JWT.secret);
      ctx.state.token = ctx.query.token;
      await ctx.render('newPassword');
    } catch (e) {
      if (e.name == 'TokenExpiredError') {
        throw new AppError(401, 105);
      } else {
        throw e;
      }
    }
  },
  
  async setNewPassword(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.user) throw new AppError(401, 102);
    try {
      const {password} = ctx.request.body;
      if (!password) throw new AppError(406, 601);
      let tempToken = ctx.query.token;
      const {_id} = jwt.verify(tempToken, JWT.secret);
      const user = await User.findOne({_id, tempToken});
      if (!user) throw new AppError(406, 104);
      tempToken = '';
      await UserService.updateUser({password, tempToken}, {_id});
      ctx.body = 'Ok';
    } catch (e) {
      if (e.name == 'TokenExpiredError') {
        throw new AppError(401, 105);
      } else {
        throw e;
      }
    }
  },
};
