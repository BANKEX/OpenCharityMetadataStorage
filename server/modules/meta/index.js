import Router from 'koa-router';
import controller from './controllers/meta-controller.js';
import jwtUser from '../../utils/getUser.js';

const router = new Router({ prefix: '/meta' });

router
  .get('/getData/:hash', jwtUser(), controller.getData)
  .post('/postData', jwtUser(), controller.postData);

export default router.routes();
