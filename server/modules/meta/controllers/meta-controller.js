import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { readFiles, writeFile, deleteFile, updateMetadata, revision } from '../services/fileService';

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

  async delData(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const hash = ctx.request.body.hash;
    if (!hash) throw new AppError(406, 601);
    await deleteFile(hash);
    ctx.body = 'Ok';
  },

  async updateData(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const { oldHash, newHash } = ctx.request.body;
    if (!oldHash || !newHash) throw new AppError(406, 601);
    await updateMetadata(oldHash, newHash);
    ctx.body = 'Ok';
  },
  
  async revision(ctx) {
    revision((rev) => {
      ctx.body = rev;
    });
  },
};
