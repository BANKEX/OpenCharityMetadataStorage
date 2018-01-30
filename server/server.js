import app from './app.js';
import { ADDRESS } from './config.js';

const server = (process.env.NODE_ENV === 'test')
  ? app.callback()
  : app.listen(ADDRESS.port, ADDRESS.ip, (err) => {
      console.log((err) ? err : `Server running on ${ADDRESS.ip}:${ADDRESS.port}`);
    });

app.on('error', (err) => {
  console.log(err.stack);
});

export default server;
