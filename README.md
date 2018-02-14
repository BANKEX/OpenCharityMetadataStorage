# OpenCharityMetadata

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файлы config: development.yaml, staging.yaml и production.yaml
```
    env: development
    address:
      internal: 'http://127.0.0.1:8080'
      external: 'http://127.0.0.1:8080'
    dirs:
      main: 'C:/NodeJS/OpenCharity'
      public: 'C:/NodeJS/OpenCharity/public/'
      storage: 'C:/NodeJS/OpenCharity/storage/'
```
4. Для запуска в development-окружении: npm run development
5. Для запуска в окружених staging |production:
    * создать пустую папку build в корне проекта
    * npm run build
    * npm run staging | production

## Тестирование
1. Установить mocha глобально: npm i mocha -g
2. Тестирование:
    * запустить сервер в требуемом окружении (development | staging | production)
    * запустить тестирование npm run testDev | testStage | testProd

## Страница тестирования API
По адресу /api/testAPI доступен интерфейс тестирования всех функций API.<br/>
Все фронтэнд-функции для работы с API см. в /public/testAPI.js

## Работа с метаданными

### GET /api/meta/getData/:hash[;:hash]
Получение метаданных от сервера по hash.<br/>
Имеются два типа данных json и binary:
    * JSON данные отдаются в кодировке utf-8, application/json.
    * binary отдаются с заголовком 'X-Content-Type-Options': 'nosniff'.
Пример обработки полученных данных см. в public/testAPI.js <br/>
Если один hash (одиночный запрос) - ответ файл по данному запросу.<br/>
Если несколько hash через ; (мультизапрос) - ответ мультипарт форма вида (всегда отдается в utf-8, 'Content-Type': 'text/plain;charset=utf-8'):

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
Фронтэнд функция sendBlobToServer принимает blob и отправляет на сервер данные через поток.<br/>
Обязательные поля для JSON-данных: title, description.<br/>
Пример обработки полученных данных см. в public/testAPI.js <br/>
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
При успешном сохранении метаинформации возвращает hash

### Структура метаданных
Данные JSON индексируются для поиска и хранятся в следующем виде:
```
{
    "title": "Первый выход в открытый космос",
    "description": "В открытом космосе всё открыто и можно идти куда захочешь.",
    "attachment":{
        "hash":"QmPB8SccRwMxFzFMdC1JVwnWku3uAUHPpvDvCLNrvUACb1",
        "name":"Стор1.pdf",
        "type":"application/pdf",
        "size":3910
    }
}
```
attachment.hash указывает на binary-данные.

### GET /api/meta/search/:text
Отдает проиндексированные JSON-данные, реально хранящиеся в storage в виде объекта {hash: data}
```
{
    "QmfJUuV34ZqBBbfQ29uj6Fu9MLzWsCLKkDJLRk6GSWWEVQ":{
        "title":"Космос близко",
        "description":"Космос там где ты",
        "attachment":{
            "hash":"QmaCvtwqsEfQAJsh97HZdWRDBEEmphYx2qbVvavTEipqWX",
            "name":"19itg8t.JPG",
            "type":"image/jpeg",
            "size":39965}
    },
    "QmegGGjJVBi4VcvUPZM6YX5aLSj7yiCZCuyD9w82izEUjX":{
        "title":"Первый выход в открытый космос",
        "description":"В открытом космосе всё открыто и можно идти куда захочешь.",
        "attachment":{
            "hash":"QmPB8SccRwMxFzFMdC1JVwnWku3uAUHPpvDvCLNrvUACb1",
            "name":"Стор1.pdf",
            "type":"application/pdf",
            "size":3910
        }
    }
}
```
