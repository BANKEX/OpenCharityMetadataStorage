import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { readFiles, writeFile } from '../services/fileService';
import { search, addJSONIndex } from '../services/searchService';

export default {
  async getData(ctx) {
    await readFiles(ctx.res, ctx.params.hash.split(';'));
  },

  async postData(ctx) {
    if (ctx.headers['content-length'] == 0) throw new AppError(406, 600);
    if (ctx.headers['content-length'] > fileSettings.uploadLimitSize) throw new AppError(406, 602);
    const tempPathFile = DIRS.storage + 'temp/' + Math.floor(Math.random()*1000000000000000);
    ctx.body = await writeFile(ctx.req, tempPathFile);
  },
  
  async search(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const searchReq = (ctx.request.body.text) ? ctx.request.body.text : ctx.request.body;
    ctx.body = await search(searchReq);
  },
  
  async addIndex(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    await addJSONIndex(ctx.request.body);
    ctx.body = 'Ok';
  },
};
