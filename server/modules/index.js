import Router from 'koa-router';
import meta from './meta';

const router = new Router({ prefix: '/api' });

router.use(meta);

export default router.routes();
