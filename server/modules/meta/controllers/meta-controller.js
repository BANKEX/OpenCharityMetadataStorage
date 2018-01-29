import {DIRS, fileSettings} from '../../../config.js';
import AppError from '../../../utils/errors.js';
import {readFiles, writeFile} from '../services/fileService';

export default {
  async getData(ctx) {
    await readFiles(ctx.res, ctx.params.hash.split(';'));
  },

  async postData(ctx) {
    if (ctx.headers['content-length'] == 0) throw new AppError(406, 600);
    if (ctx.headers['content-length'] > fileSettings.uploadLimitSize) throw new AppError(406, 602);
    const tempPathFile = DIRS.main + DIRS.storage + 'temp/' + Math.floor(Math.random()*1000000000000000);
    ctx.body = { data: await writeFile(ctx.req, tempPathFile) };
  },
};
