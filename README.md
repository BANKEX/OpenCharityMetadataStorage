# OpenCharityMetadata

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файлы config: development.yaml, staging.yaml и production.yaml
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
Фронтэнд функция sendBlobsToServer принимает blobs - нумированный объект или массив и отправляет на сервер данные через поток.<br/>
Пример обработки полученных данных см. в public/testAPI.js <br/>
```
const sendBlobsToServer = (blobs) => {
  return new Promise((resolve, reject) => {
    let counter=0;
    const hashes = [];
    for (let i=0, len=blobs.length; i<len; i++) {
      const blob = blobs[i];
      const reader = new FileReader();
      const xhr = new XMLHttpRequest();
      xhr.open('post', '/api/meta/postData');
      xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');
      reader.readAsArrayBuffer(blob);
      reader.onload = function (event) {
        xhr.send(event.target.result);
        xhr.onload = (event) => {
          if (event.target.status==200) {
            hashes[i] = event.target.responseText;
            counter++;
            if (counter==len) resolve(hashes);
          } else {reject(event.target.responseText)}
        };
      }
    }
  });
};
```
При успешном сохранении метаинформации возвращает массив hashes.

### Структура метаданных
Данные JSON индексируются для поиска и хранятся, например, в следующем виде:
```
{
    "eventName":"название пакета  документов",
    "eventDetails":"описание пакета документов",
    "images":[
        {
        "hash":"QmaCvtwqsEfQAJsh97HZdWRDBEEmphYx2qbVvavTEipqWX",
        "name":"19itg8t.JPG",
        "type":"image/jpeg",
        "size":39965
        },{
        "hash":"QmPB8SccRwMxFzFMdC1JVwnWku3uAUHPpvDvCLNrvUACb1",
        "name":"Стор1.pdf",
        "type":"application/pdf",
        "size":3910
        }
    ]
}
```
images.hash указывает на binary-данные.

### POST /api/meta/search
Ищет запрос в проиндексированных данных.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Запрос может быть двух видов:
1. Обычный текстовый запрос. Например, строка 'космос текст' найдет все документы где в теле упоминаются оба этих слова.
2. Запрос JSON по правилам библиотеки search-index (https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md)

Возвращает объект вида:
```
    {multiHash: {document}, multiHash: {document}, ...}
```
multiHash актуален только для метаданных. По нему можно найти соответствующий документ на метасервере.<br/>
Пример:
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
    "Qmdw8cYKmUDxmeNLjZBjukazaDEQs25ZyVTRfuQ8mjcjGL":{
        "name":"first CE",
        "payed":"0",
        "target":"1000",
        "raised":"0",
        "tags":"0x30",
        "address":"0x4fefeb18f51d658ab7bf71f7613196f9401af87f",
        "date":"2018-2-18 13:55:15"
    }
}
```
