import mongoose from 'mongoose';

mongoose.Promise = Promise;

export default (mongoUri) => {
  if (!mongoUri) {
    throw Error('Mongo uri is undefined');
  }

  return mongoose
    .connect(mongoUri)
    .then((mongodb) => {
      console.log('Mongo connected');
      return mongodb;
    })
    .catch((err) => {
      console.log('Mongo connection failed');
      throw err;
    });
};
