# OpenCharity Server

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файлы config: development.yaml и production.yaml
```
    env: development
    address:
      protocol: http
      ip: 'localhost'
      port: 8080
    dirs:
      main: 'C:/NodeJS/OpenCharity'
      public: 'C:/NodeJS/OpenCharity/public/'
      storage: 'C:/NodeJS/OpenCharity/storage/'
```
4. Для запуска в development-окружении: npm run development
5. Для запуска в production-окружении:
    * отредактировать package.json -> scripts -> clean под конктреную ОС
    * создать пустую папку build в корне проекта
    * npm run production

## Тестирование
1. Установить mocha глобально: npm i mocha -g
2. Тестирование в development-окружении:
    * запустить сервер в development-окружении: npm run development
    * npm run testDev
3. Тестирование в production-окружении:
    * запустить сервер в production-окружении: npm run production
    * npm run testProd

## Работа с метаданными

### POST /api/meta/getData/:hash[;:hash]
Получение метаданных от сервера по hash.<br/>
Кодировка utf-8.<br/>
Если один hash (одиночный запрос) - ответ файл по данному запросу.<br/>
Если несколько hash через ; (мультизапрос) - ответ мультипарт форма вида:

    ----------------------------383220747894497436223661
    Content-Disposition: form-data; name="QmQUAA66JLVghKEZ6n5F2N6UVkvmf4AbAUsuJaeV9SNxha"; filename="6n5F2N6UVkvmf4AbAUsuJaeV9SNxha"
    Content-Type: application/octet-stream

    {"a": "sdfs","b":"sdfsdfgg"}
    ----------------------------383220747894497436223661
    Content-Disposition: form-data; name="Qmd3f7wWCdWkbKQjpN3bW7WMEbxTsKTM5a6NTYQxcuTJEd"; filename="pN3bW7WMEbxTsKTM5a6NTYQxcuTJEd"
    Content-Type: application/octet-stream

    sdfs
    ----------------------------383220747894497436223661
    Content-Disposition: form-data; name="fsdf"

    false
    ----------------------------383220747894497436223661--

Если в одинночном запросе hash не найден возвращает 404.<br/>
Если в мультизапросе один или несколько hash'ей не найдено, возвращается false в данном блоке.

### POST /api/meta/postData
Отправка метаданных на сервер.<br/>
Фронтэнд функция sendBlobToServer принимает blob и отправляет на сервер данные через поток.
```
const sendBlobToServer = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const xhr = new XMLHttpRequest();
    xhr.open('post', '/api/meta/postData');
    xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');
    reader.readAsArrayBuffer(blob);
    reader.onload = function (event) {
      xhr.send(event.target.result);
      xhr.onload = function (event) {
        switch (event.target.status) {
          case 200:
            resolve(event.target.responseText);
            break;
          default:
            reject(event.target.responseText);
        }
      };
    }
  });
};
```
При успешном сохранении метаинформации возвращает JSON-объект {data: hash}
