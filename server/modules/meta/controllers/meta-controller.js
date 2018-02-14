import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { readFiles, writeFile, search } from '../services/fileService';

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
    ctx.body = JSON.stringify(await search(ctx.params.text));
  },
};
