import Router from 'koa-router';
import meta from './meta';
import search from './search';

const router = new Router({ prefix: '/api' });

router.use(meta);
router.use(search);

export default router.routes();
