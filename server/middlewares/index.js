import fs from 'fs';

export default (app) => {
  console.log('Middleware functions');
  const stack = fs.readdirSync(__dirname + '/stack').sort();
  stack.forEach((file) => {
    require('./stack/' + file).default(app);
  });
};
