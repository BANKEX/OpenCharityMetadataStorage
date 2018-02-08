import app from 'app';
import { ADDRESS } from 'configuration';
import url from 'url';
const internalURL = url.parse(ADDRESS.internal);

const server = (process.env.NODE_ENV === 'test')
  ? app.callback()
  : app.listen(internalURL.port, internalURL.hostname, (err) => {
  console.log((err) ? err : `Server running on ${ADDRESS.internal}`);
});

app.on('error', (err) => {
  console.log(err.stack);
});

export default server;
