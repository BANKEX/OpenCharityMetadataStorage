import fs from 'fs';

export default (app) => {
  process.stdout.write('Middleware...');
  const stack = fs.readdirSync(__dirname + '/stack').sort();
  stack.forEach((file) => {
    if (file.indexOf('-dev-') == 2) {
      if (process.env.NODE_ENV == 'development') {
        require('./stack/' + file).default(app);
      }
    } else {
      require('./stack/' + file).default(app);
    }
    process.stdout.write('.');
  });
  console.log('done');
};
