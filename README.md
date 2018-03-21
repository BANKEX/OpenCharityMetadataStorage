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
Данные JSON индексируются для поиска и хранятся в следующем виде:
```
{
    "type":1,
    "searchDescription":"",
    "data":{
        "title":"Test 1903",
        "description":"talk hide ride",
        "image":{
            "name":"19itg8t.JPG",
            "type":"image/jpeg",
            "size":39965,
            "storageHash":"QmaCvtwqsEfQAJsh97HZdWRDBEEmphYx2qbVvavTEipqWX"
        },
        "attachments": [{аналогично image}]
    }
}
```

### POST /api/meta/delData
Удаляет метаданные по hash.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательное поле hash.<br/>

### POST /api/meta/updateData
Доступно только для JSON-метаданных.<br/>
Удаляет JSON oldHash, учитывая перекресные ссылки с JSON newHash, удаляет неиспользуемые бинарники, снимает индексацию с oldHash.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательные поля { oldHash, newHash }.<br/>

### GET /api/meta/revision/:type
Производит ревизию метаданных.<br/>
Возвращает объект с полями в зависимости от типа запроса.<br/>
type: ['lite', 'long', 'deep']<br/>
1. lite - простая инвентаризация.
    * missedBinary - список бинарников, на которые ссылают JSON, но их нет
    * missedJSON - список JSON, на которые ссылается DB Metamap, но их нет
    * unusedBinary - список бинарников, которые занимают дисковое пространство, но не используются ни одним JSON
    * unusedJSON - список JSON, не упомянутых в DB Metamap
    * statistic - статистические данные
2. long - тоже самое, что lite, но добавляется еще 1 поле:
    * storeJSON - это объект {hashJSON: [hashBinary]} - информация о всех хранимых данных.
3. deep - тоже самое, что lite, но добавляется еще 1 поле:
    * wrongMultiHash - список hashes, имя которых не соответствует содержимому.
Обязательное поле hash.<br/>

### POST /api/meta/recover
Вносит исправления в хранилище метаданных на основаниии ревизии.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Обязательные поля password и type.<br/>
type: ['wrongMultiHash', 'unusedJSON', 'unusedBinary']
1. wrongMultiHash - удаляет все файлы hash, которых не соответствует их содержимому.
2. unusedJSON - удаляет все JSON-файлы не упомянутые в DB Metamap
3. unusedBinary - удаляет все неиспользуемые бинарники
Для полной отчиски хранилища необходимо запустить последовательно данную функцию 3 раза по порядку.


### POST /api/meta/search
Ищет запрос в проиндексированных данных.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Принимает запрос по правилам библиотеки search-index (https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md)<br/>
Возвращает массив объектов вида: `{ type, searchDescription, data, id }`<br/>
Если id начинается с 'Qm...', то это объект метаданных, если с '0x...', то это DAPP-объект.<br/>


