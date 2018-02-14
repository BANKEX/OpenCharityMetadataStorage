import Router from 'koa-router';

const router = new Router();

router
  .get('/api/testAPI', async (ctx) => {
    await ctx.render('testAPI');
  })
  .get('*', async (ctx) => {
    ctx.body = 'metadata';
  })
;

export default router.routes();
