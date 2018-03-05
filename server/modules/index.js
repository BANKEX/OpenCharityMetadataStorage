import Router from 'koa-router';
import meta from './meta';
import settings from './settings';

const router = new Router({ prefix: '/api' });

router.use(meta);
router.use(settings);

export default router.routes();
