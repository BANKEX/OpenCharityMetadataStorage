import { DIRS } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import fs from 'fs';

const pathORG = DIRS.public + 'constants/' + process.env.NODE_ENV + '.json';

export default {
  getOrgs(ctx) {
    delete require.cache[require.resolve(pathORG)];
    ctx.body = require(pathORG);
  },

  postOrgs(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='refresh') throw new AppError(401, 100);
    try {
      const orgs = JSON.parse(ctx.request.body.orgs);
      fs.writeFileSync(pathORG, JSON.stringify(orgs));
      ctx.body = 'Ok';
    } catch (e) {
      throw e;
    }
  },
};
