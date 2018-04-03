import Router from 'koa-router';
import search from './controllers/search-controller.js';
import { Metamap } from './models';

const router = new Router({ prefix: '/search' });

router
  .post('/search', search.search)
  .post('/reindex', search.reindex)
  .post('/drop', search.drop)
;

export default router.routes();

export {
  Metamap,
};
