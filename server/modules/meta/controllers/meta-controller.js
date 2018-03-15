import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { readFiles, writeFile, deleteFile, updateMetadata, revisionData } from '../services/fileService';

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
    deleteFile(hash);
    ctx.body = 'Ok';
  },

  async updateData(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    const { oldHash, newHash } = ctx.request.body;
    if (!oldHash || !newHash) throw new AppError(406, 601);
    updateMetadata(oldHash, newHash);
    ctx.body = 'Ok';
  },
  
  async revision(ctx) {
    if (ctx.params.set == 'lite') ctx.body = await revisionData();
    if (ctx.params.set == 'deep') ctx.body = 'Ревизия с чтением каждого файла и сравнение хэша с назаванием файла';
    if (ctx.params.set == 'long') ctx.body = await revisionData('long');
  },

  async recover(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='recover') throw new AppError(401, 100);
    const rev = await revisionData();
    rev.noUse.forEach(deleteFile);
    ctx.body = 'Ok';
  },
};
