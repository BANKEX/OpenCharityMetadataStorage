import pick from 'lodash.pick';
import AppError from 'AppErrors';
import { User } from '../models';
import { UserService } from '../services';

export default {
  currentUser: async (ctx) => {
    if (!ctx.user) throw new AppError(401, 101);
    const { user: { _id } } = ctx;
    const user = await UserService.getUserWithPublicFields({ _id });
    ctx.body = { data: user };
  },

  changeUser: async (ctx) => {
    if (!ctx.user) throw new AppError(401, 101);
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
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

  deleteUser: async (ctx) => {
    if (!ctx.user) throw new AppError(401, 101);
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const { password } = ctx.request.body;
    if (!password) throw new AppError(406, 601);
    if (!ctx.user.comparePasswords(password)) throw new AppError(401, 100);
    const { user: { _id } } = ctx;
    await User.deleteOne({ _id });
    ctx.cookies.set('jwt', '', {httpOnly: true});
    ctx.headers.authorization = '';
    ctx.redirect('/');
  },
};
