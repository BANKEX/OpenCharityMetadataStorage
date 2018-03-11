const errorMessages = {
  10: 'Неверный запрос',
  100: 'Неверное имя пользователя или пароль',
  101: 'Требуется авторизация',
  102: 'Повторная авторизация невозможна',
  103: 'На данном e-mail уже зарегистрирован другой пользователь',
  104: 'Пользователь с данным e-mail не найден',
  105: 'Истекло время изменения пароля',
  401: 'userID не найден',
  600: 'Неверный запрос',
  601: 'В запросе отсутствует необходимый параметр',
  602: 'Слишком большой размер входящих данных',
  603: 'Ошибка потока данных',
  605: 'Внутренняя ошибка',
  606: 'Файл не найден',
  607: 'JSON-метаданные должен содержать поля: searchDescrition, datatype, data',
  608: 'Ошибка формата полей JSON-метаданных',
  609: 'data не может быть пустым объектом',
  620: 'Ошибка поискового запроса',
  621: 'Пустой поисковый запрос',
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
