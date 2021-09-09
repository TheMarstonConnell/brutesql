MySQL store adapter for the [express-brute](https://github.com/AdamPflug/express-brute).

## Installation

~~~
npm install brutesql
~~~

## Usage

~~~javascript
const ExpressBrute = require('express-brute');
const BruteSQL = require('../mysqlbrute');
const bruteStore = new BruteSQL({host: process.env.DB_HOST, user: process.env.DB_USER, pass: process.env.DB_PASS});
const bruteforce = new ExpressBrute(bruteStore);


app.post('/auth', bruteforce.prevent, (req, res) => {});
~~~

## License

This project is licensed under the MIT license.
