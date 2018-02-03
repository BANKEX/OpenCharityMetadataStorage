import serve from 'koa-static';
import {DIRS} from 'configuration';

export default (app) => {
  if (process.env.NODE_ENV == 'development') {
    app.use(serve(DIRS.public));
  }
};
