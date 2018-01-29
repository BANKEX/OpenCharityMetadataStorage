import { User } from '../models';
import AppError from '../../../utils/errors.js';

export default {
  async createUser(data) {
    try {
      return await User.create(data);
    } catch (e) {
      const { message, errors, name } = e;
      if (name == 'ValidationError') {
        throw new AppError(400, message, errors);
      } else {
        throw e;
      }
    }
  },

  getUserWithPublicFields(params) {
    return User.findOne(params).select({ password: 0, __v: 0, createdAt: 0, updatedAt: 0 });
  },

  updateUser(params, _id) {
    return User.update({ _id }, params);
  },
};
