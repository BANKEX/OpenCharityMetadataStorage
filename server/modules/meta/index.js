import Router from 'koa-router';
import meta from './controllers/meta-controller.js';

const router = new Router({ prefix: '/meta' });

router
  .get('/getData/:hash', meta.getData)
  .post('/postData', meta.postData)
  .post('/delData', meta.delData)
  .post('/updateData', meta.updateData)
  .get('/revision/:type', meta.revision)
  .post('/recover', meta.recover)
;

export default router.routes();
