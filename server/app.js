import Koa from 'koa';
import inits from 'inits';
import middlewares from 'middlewares';
import pages from 'pages';
import modules from 'modules';

const app = new Koa();
app.state = {
  dapp: [0, 0],
  initList: false,
  web3: false,
  previous: [],
  actual: [],
  previousORG: [],
  actualORG: [],
};

app.start = async () => {
  await inits();
  middlewares(app);
  app.use(modules);
  app.use(pages);
};

export default app;
