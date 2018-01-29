# OpenCharity Server

## Установка
1. склонировать репозиторий
2. npm install
3. настроить файл config/development.json

    {
      "env" : "development",
      "ip": MY_IP_ADRESS,
      "port": MY_PORT,
      "dirs": {
        "main": MY_MAIN_DIR,
        "public": "public/",
        "storage": "storage/"
      },
      "mongoURI": "mongodb://summary:qwe123POI@ds033956.mlab.com:33956/summary"
    }

4. npm run dev

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

При успешном сохранении метаинформации возвращает JSON-объект {data: hash}

## Работа с пользователями

### POST /api/user/signup
Регистрация пользователя на сервере.<br/>
Вернет ошибку если пользователь уже авторизован.<br/>
Принимает content-type application/json.<br/>
В JSON должны находиться обзательные поля для создания пользователя.<br/>
В данный момент это ['email', 'firstName', 'lastName', 'password']<br/>
Возвращает JSON-объект {data: user}

### POST /api/user/login
Авторизация пользователя на сервер.<br/>
Вернет ошибку если пользователь уже авторизован.<br/>
Принимает content-type application/json.<br/>
В JSON должны находиться обзательные поля для логина - ['email', 'password'].<br/>
Возвращает JSON-объект {data: token}<br/>
Кроме того, записывает token в cookie.jwt.

### GET /api/user/logout
Логаут пользователя.<br/>
Вернет ошибку если пользователь не авторизован.<br/>
Удаляет cookie.jwt и headers.autorization.<br/>
Редирект на '/'.

### GET /api/user
Вернет ошибку если пользователь не авторизован.<br/>
Возвращает JSON-объект {data: user}<br/>

    {
        "data": {
            "tags": [
                "тэг",
                "#openCharity",
                "id234623422",
                "#наПеченькиДетям"
            ],
            "_id": "5a6f09b2d2879918385caa68",
            "email": "asd@asd.asd",
            "firstName": "Пётр",
            "lastName": "Иванов",
            "hash": "d347487c-cb2f-47f1-a7a5-964876e70861"
        }
    }

### Распознавание авторизации пользователя
Авториация распознается по 4 параметрам:
1. get запрос с параметром &jwt=key
2. post запрос json, в теле которого есть jwt: key
3. headers.autorization = key
4. cookie.jwt = key


### POST /api/user/change
Вернет ошибку если пользователь не авторизован.<br/>
Принимает content-type application/json.<br/>
Из JSON будут взяты в обработку поля (на данный момент это):
['firstName', 'lastName', 'tags']<br/>
Если в JSON имеется поле 'newpassword' (новый пароль),
то требуется также поле 'password' (существующий пароль).<br/>
Возвращает JSON-объект {data: updatedUser}
