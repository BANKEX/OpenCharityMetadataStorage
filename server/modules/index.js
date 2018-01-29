import Router from 'koa-router';
import user from './user';
import meta from './meta';

const router = new Router({ prefix: '/api' });

router.use(user);
router.use(meta);

export default router.routes();
