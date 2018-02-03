import Router from 'koa-router';
import controller from './controllers/meta-controller.js';

const router = new Router({ prefix: '/meta' });

router
  .get('/getData/:hash', controller.getData)
  .post('/postData', controller.postData);

export default router.routes();
