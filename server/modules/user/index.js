import Router from 'koa-router';
import authController from './controllers/auth-controller.js';
import userController from './controllers/user-controller.js';
import jwtUser from '../../utils/getUser.js';

const router = new Router({ prefix: '/user' });

router
  .post('/signup', jwtUser(), authController.signup)
  .post('/login', jwtUser(), authController.login)
  .get('/logout', jwtUser(), authController.logout)
  .post('/forgot', jwtUser(), authController.forgotPassword)
  .get('/setNewPassword', jwtUser(), authController.setNewPasswordData)
  .post('/setNewPassword', jwtUser(), authController.setNewPassword)
  .get('/', jwtUser(), userController.currentUser)
  .post('/change', jwtUser(), userController.changeUser)
  .post('/delete', jwtUser(), userController.deleteUser)
  ;

export default router.routes();
