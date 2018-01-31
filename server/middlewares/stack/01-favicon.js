import favicon from 'koa-favicon';
import {DIRS} from 'configuration';

export default (app) => {
  if (process.env.NODE_ENV == 'development') {
    app.use(favicon(DIRS.main + DIRS.public + 'favicon.png'));
  }
};
