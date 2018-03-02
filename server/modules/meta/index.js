import Router from 'koa-router';
import controller from './controllers/meta-controller.js';

const router = new Router({ prefix: '/meta' });

router
  .get('/getData/:hash', controller.getData)
  .post('/postData', controller.postData)
  .post('/search', controller.search)
  .post('/addIndex', controller.addIndex)
  .post('/reindex', controller.reindex)
  .post('/drop', controller.drop)
;

export default router.routes();
