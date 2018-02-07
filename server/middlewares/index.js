import fs from 'fs';

export default (app) => {
  console.log('Middleware functions');
  const stack = fs.readdirSync(__dirname + '/stack').sort();
  stack.forEach((file) => {
    if (file.indexOf('-dev-') == 2) {
      if (process.env.NODE_ENV == 'development') {
        console.log(file);
        require('./stack/' + file).default(app);
      }
    } else {
      console.log(file);
      require('./stack/' + file).default(app);
    }
  });
};
