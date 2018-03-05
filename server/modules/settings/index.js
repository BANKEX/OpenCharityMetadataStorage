import Router from 'koa-router';
import controller from './controllers/set-controller.js';

const router = new Router({ prefix: '/settings' });

router
  .get('/organizations', controller.getOrgs)
  .post('/organizations', controller.postOrgs)
;

export default router.routes();
