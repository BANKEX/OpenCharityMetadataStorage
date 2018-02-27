import Router from 'koa-router';

const router = new Router();

router
  .get('/', async (ctx) => {
    ctx.body = 'metadata';
  })
  .get('/api/testAPI', async (ctx) => {
    await ctx.render('testAPI');
  })
  .get('*', async (ctx) => {
    ctx.state.message = 'Запрос к API некорректен';
    ctx.state.status = 404;
    ctx.res.statusCode = 404;
    await ctx.render('error');
  })
;

export default router.routes();
