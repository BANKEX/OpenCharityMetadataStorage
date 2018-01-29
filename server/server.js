import app from './app.js';
import {IP, PORT} from './config.js';

const server = (process.env.NODE_ENV === 'test')
  ? app.callback()
  : app.listen(PORT, IP, (err) => {
      console.log((err) ? err : `Server running on ${IP}:${PORT}`);
    });

app.on('error', (err) => {
  console.log(err.stack);
});

export default server;
