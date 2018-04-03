import { DIRS, fileSettings } from 'configuration';
import AppError from '../../../utils/AppErrors.js';
import { init, search, addBatchToLine, close, flush } from '../services/search-service';
import { Metamap } from '../index';
import fs from 'fs';
import io from '../io';

export default {
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
      const type = Number(searchRequest.query.AND['type'][0]);
      if (isNaN(type)) throw new AppError(406, 620);
      if (!Number.isInteger(type) || type<0) throw new AppError(406, 620);
    }
    searchRequest.query.AND['*'] = filteredStar;

    const documents = await search(searchRequest);
    
    const addresses = [];
    await Promise.all(documents.map(async (doc) => {
      let docAddress = doc.id;
      if (doc.id.indexOf('Qm')==0) {
        const metamap = await Metamap.findOne({ hash: doc.id });
        docAddress = (metamap) ? metamap.address : false;
      }

      if (docAddress) {
        if (addresses.indexOf(docAddress) == -1) addresses.push(docAddress);
      } else {
        console.log('No address');
      }
      return true;
    }));
  
    ctx.body = addresses;
  },
  
  async reindex(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='reindex') throw new AppError(401, 100);
    await flush();
    console.log('---------------------');
    const revision = await io.revisionMetadata('long');
    const storedJSONs = Object.getOwnPropertyNames(revision.storeJSON);
    const usedJSONs = storedJSONs.filter((el) => (revision.unusedJSON.indexOf(el)==-1));
    usedJSONs.forEach((hash) => {
      const path = io.getMetadataStoragePath(hash);
      const file = fs.readFileSync(path);
      const obj = JSON.parse(file);
      obj.id = hash;
      addBatchToLine([obj]);
    });
    ctx.body = 'Ok';
  },

  async drop(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='drop') throw new AppError(401, 100);
    await close();
    io.deleteMetadataStorage();
    await init();
    ctx.body = 'Ok';
  },

};
