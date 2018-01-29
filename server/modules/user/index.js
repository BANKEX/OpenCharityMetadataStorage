import Router from 'koa-router';
import authController from './controllers/auth-controller.js';
import jwtUser from '../../utils/getUser.js';

const router = new Router({ prefix: '/user' });

router
  .post('/signup', jwtUser(), authController.signup)
  .post('/login', jwtUser(), authController.login)
  .get('/logout', jwtUser(), authController.logout)
  .get('/', jwtUser(), authController.currentUser)
  .post('/change', jwtUser(), authController.changeUser)
  .post('/forgot', jwtUser(), authController.forgotPassword);

export default router.routes();
