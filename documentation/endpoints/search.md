
### POST /api/search/search
Ищет запрос в проиндексированных данных.<br/>
Принимает content-type application/json и application/x-www-form-urlencoded.<br/>
Принимает запрос по правилам библиотеки search-index (https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md)<br/>
Возвращает массив DAPP-адресов.