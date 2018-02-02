import Router from 'koa-router';
import controller from './controllers/dapp-controller.js';
import jwtUser from '../../utils/getUser.js';

const router = new Router({ prefix: '/dapp' });

router
  .get('/getOrganization', jwtUser(), controller.getOrganization)
  .get('/getCharityEvents', jwtUser(), controller.getCharityEvents)
  .get('/getIncomingDonations', jwtUser(), controller.getIncomingDonations)
  .get('/getCharityEvent/:hash', jwtUser(), controller.getCharityEvent)
  .get('/getIncomingDonation/:hash', jwtUser(), controller.getIncomingDonation)
;

export default router.routes();