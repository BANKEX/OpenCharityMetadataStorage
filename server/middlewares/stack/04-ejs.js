import render from 'koa-ejs';
import {DIRS} from 'configuration';

let options = {
  root: DIRS.main + DIRS.public,
  layout: false,
  viewExt: 'ejs',
  cache: false,
  debug: false,
};

export default (app) => render(app, options);
