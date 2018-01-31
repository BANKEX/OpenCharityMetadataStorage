import { User } from '../models';
import AppError from 'AppErrors';
import {JWT} from 'configuration';
import jwt from 'jsonwebtoken';

export default {
  createUser: async (data) => {
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

  getUserWithPublicFields: (params) => {
    return User.findOne(params).select({ 
      tempToken: 0, 
      password: 0, 
      __v: 0, 
      createdAt: 0, 
      updatedAt: 0,
    });
  },

  updateUser: (params, _id) => {
    return User.update({ _id }, params);
  },
  
  setTempToken: async (_id) => {
    const payload = {
      _id: _id,
      exp: Math.floor(Date.now() / 1000) + JWT.temporaryTokenExp,
    };
    const tempToken = jwt.sign(payload, JWT.secret);
    await User.update({ _id }, { tempToken });
    return tempToken;
  },
};
