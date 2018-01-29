import serve from 'koa-static';
import {DIRS} from '../../config.js';

export default (app) => {
  if (process.env.NODE_ENV == 'development') {
    app.use(serve(DIRS.main + DIRS.public));
  }
};
