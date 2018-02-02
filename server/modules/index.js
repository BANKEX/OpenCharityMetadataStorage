import Router from 'koa-router';
import user from './user';
import meta from './meta';
import dapp from './dapp';

const router = new Router({ prefix: '/api' });

router.use(user);
router.use(meta);
router.use(dapp);

export default router.routes();
