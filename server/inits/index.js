import fs from 'fs';

export default () => {
  console.log('Initialization functions');
  const stack = fs.readdirSync(__dirname + '/stack').sort();
  stack.forEach((file) => {
    console.log(file);
    require('./stack/' + file).default();
  });
};
