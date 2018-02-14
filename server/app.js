import Koa from 'koa';
import inits from 'inits';
import middlewares from 'middlewares';
import pages from 'pages';
import modules from 'modules';

const app = new Koa();
inits();
middlewares(app);
app.use(modules);
app.use(pages);

export default app;
