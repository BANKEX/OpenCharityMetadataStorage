import favicon from 'koa-favicon';
import { DIRS } from 'configuration';

export default (app) => {
  app.use(favicon(DIRS.public + 'favicon.png'));
};
