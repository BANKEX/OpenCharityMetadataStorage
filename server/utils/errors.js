const errorMessages = {
  10: 'Неверный запрос',
  100: 'Неверное имя пользователя или пароль',
  101: 'Требуется авторизация',
  102: 'Повторная авторизация невозможна',
  103: 'На данном e-mail уже зарегистрирован другой пользователь',
  401: 'userID не найден',
  600: 'Неверный запрос',
  601: 'В запросе отсутствует необходимый параметр',
  602: 'Слишком большой размер входящих данных',
  603: 'Ошибка потока данных',
  605: 'Внутренняя ошибка',
  606: 'Файл не найден',
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
