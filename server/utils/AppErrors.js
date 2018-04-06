const errorMessages = {
  10: 'Wrong request',
  100: 'Incorrect username or password',
  101: 'Authorization required',
  102: 'Re-authorization is not possible',
  103: 'E-mail already in use',
  104: 'Incorrect e-mail',
  400: 'DB validation error',
  600: 'Wrong request',
  601: 'Required param missed in request',
  602: 'Incoming data too large',
  603: 'Stream data error',
  605: 'Internal error',
  606: 'File not found',
  607: 'JSON must have fields: searchDescrition, datatype, data',
  608: 'Error JSON fields format',
  609: 'data should not be empty object',
  610: 'This file can`t be deleted yet',
  620: 'Search request error',
  621: 'Empty search request',
};

function AppError(httpError, appError, errors) {
  this.name = 'ApplicationError';
  this.status = httpError;
  this.message = errorMessages[appError];
  this.errs = errors;
  this.stack = (new Error()).stack;
}

AppError.prototype = Object.create(Error.prototype);
AppError.prototype.constructor = AppError;

export default AppError;
