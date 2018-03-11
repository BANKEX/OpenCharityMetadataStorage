import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { readFiles, writeFile, deleteStorage, deleteIndex, researchData } from '../services/fileService';
import { init, search, addJSONIndex, addFileIndex, close } from '../services/searchService';

const SEARCHTYPES = ['charityevent', 'incomingdonation', 'organization'];

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
    const searchRequest = ctx.request.body;
    if (!searchRequest.query) throw new AppError(406, 620);
    if (!searchRequest.query.AND) throw new AppError(406, 620);
    console.log(searchRequest.query.AND);
    if (!searchRequest.query.AND['*']) throw new AppError(406, 620);
    if (!Array.isArray(searchRequest.query.AND['*'])) throw new AppError(406, 620);
    const filteredStar = searchRequest.query.AND['*'].filter((elem) => (typeof elem == 'string'));
    if (filteredStar.length==0) throw new AppError(406, 621);
    if (searchRequest.query.AND['type']) {
      if (!Array.isArray(searchRequest.query.AND['type'])) throw new AppError(406, 620);
      if (searchRequest.query.AND['type'].length==0) throw new AppError(406, 620);
      if (!searchRequest.query.AND['type'][0]) throw new AppError(406, 620);
      if (SEARCHTYPES.indexOf(searchRequest.query.AND['type'][0])==-1) throw new AppError(406, 620);
    }
    searchRequest.query.AND['*'] = filteredStar;
    ctx.body = await search(searchRequest);
  },
  
  async addIndex(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    await addJSONIndex(ctx.request.body);
    ctx.body = 'Ok';
  },

  async reindex(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='reindex') throw new AppError(401, 100);
    await close();
    await deleteIndex();
    init(() => {
      researchData(addFileIndex);
    });
    ctx.body = 'Ok';
  },

  async drop(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='drop') throw new AppError(401, 100);
    await close();
    await deleteStorage();
    init();
    ctx.body = 'Ok';
  },
};
