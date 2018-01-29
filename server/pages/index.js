import Router from 'koa-router';
import getUser from '../utils/getUser.js';

const router = new Router();

router
  .get('/', getUser(), async (ctx) => {
    await ctx.render('index');
  });

export default router.routes();
