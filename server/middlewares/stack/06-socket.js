import IO from 'koa-socket';
import socketsApp from '../../sockets';

export default (app) => {
  const io = new IO();
  io.attach(app);
  app.io.on('connection', socketsApp);
};
