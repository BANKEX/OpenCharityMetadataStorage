import Router from 'koa-router';
import app from 'app';
import { ADDRESS } from 'configuration';

const router = new Router();

router
  .get('/', async (ctx) => {
    ctx.body = 'metadata';
  })
  .get('/api/testAPI', async (ctx) => {
    await ctx.render('testAPI');
  })
  .get('/api/swagger.json', (ctx) => {
    ctx.body = app.state.swaggerSpec;
  })
  .get('/api/docs', async (ctx) => {
    ctx.redirect('/api/docs/index');
  })
  .get('/api/docs/index', async (ctx) => {
    ctx.state.urlExternal = ADDRESS.external+'/api/swagger.yaml';
    await ctx.render('api/docs/index');
  })
  .get('*', async (ctx) => {
    ctx.state.message = 'Wrong API request';
    ctx.state.status = 404;
    ctx.res.statusCode = 404;
    await ctx.render('error');
  })
;

export default router.routes();
