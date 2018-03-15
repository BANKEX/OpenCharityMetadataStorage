import Router from 'koa-router';
import meta from './controllers/meta-controller.js';
import search from './controllers/search-controller.js';

const router = new Router({ prefix: '/meta' });

router
  .get('/getData/:hash', meta.getData)
  .post('/postData', meta.postData)
  .post('/delData', meta.delData)
  .post('/updateData', meta.updateData)
  .get('/revision/:set', meta.revision)
  .post('/recover', meta.recover)
  
  .post('/search', search.search)
  .post('/addIndex', search.addIndex)
  .post('/reindex', search.reindex)
  .post('/drop', search.drop)
  .post('/flush', search.flush)
  .post('/delIndex', search.delIndex)
  .get('/getid/:id', search.getid)
;

export default router.routes();
