import mongoose from 'mongoose';

mongoose.Promise = Promise;

export default (mongoUri) => {
  return mongoose
    .connect(mongoUri)
    .then((mongodb) => {
      return mongodb;
    })
    .catch((err) => {
      throw err;
    });
};
