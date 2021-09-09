const mysql = require('mysql2');
const AbstractClientStore = require('express-brute/lib/AbstractClientStore');
const _ = require('underscore');
var moment = require('moment');



var BruteSQL = module.exports = function (options) {
    AbstractClientStore.apply(this, arguments);

	this.options = _.extend({}, BruteSQL.defaults, options);
    this.connection = mysql.createConnection({
        host: this.options.host,
        user: this.options.user,
        password: this.options.pass,
    });


    this.connection.query('CREATE DATABASE IF NOT EXISTS ' + this.options.database, [], (err, results) => {
        if(err){
            console.error(err);
        }

        this.pool = mysql.createConnection({
            host: this.options.host,
            user: this.options.user,
            database: this.options.database,
            password: this.options.pass,
            waitForConnections: true,
            connectionLimit: this.options.connectionLimit,
            queueLimit: 0
        });

        this.pool.query('CREATE TABLE IF NOT EXISTS brutesql (id varchar(255) NOT NULL UNIQUE, data varchar(255) NOT NULL, expires DATETIME NOT NULL)', [], (err, result) => {
            if(err){
                console.error(err);
                return;
            }
        });
    });
};


BruteSQL.prototype = Object.create(AbstractClientStore.prototype);

BruteSQL.prototype.set = function (key, value, lifetime, callback) {
	key = this.options.prefix+key;
    let expiration = lifetime ? moment().add(lifetime, 'seconds').toDate() : undefined;
	value = JSON.stringify(value);

    this.pool.query("INSERT INTO brutesql (id, data, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=?, data=?, expires=?;", [key, value, expiration, key, value, expiration], (err, result) => {
        if(err){
            console.error(err);
        }

        typeof callback == 'function' && callback(null);

    });

	
};


BruteSQL.prototype.get = function (key, callback) {
	key = this.options.prefix+key;

    this.pool.query("SELECT * FROM brutesql WHERE id=?;", [key], (err, result) => {
        if(err){
            typeof callback == 'function' && callback(err, null);
        }

        if(result.length>0){

            let data = null;

            let res = result[0];
            if(res.expires < new Date()){
                this.pool.query("DELETE FROM brutesql WHERE id=?;", [key], (err, result) => {
                    if(err){
                        console.error(err);
                    }
                });
                return callback();

            }

            data = JSON.parse(res.data);
            data.lastRequest = new Date(data.lastRequest);
            data.firstRequest = new Date(data.firstRequest);

            typeof callback == 'function' && callback(err, data);
            return;
        }

        typeof callback == 'function' && callback(err, null);

        


    });
};


BruteSQL.prototype.reset = function (key, callback) {
	key = this.options.prefix+key;
	
	this.pool.query("DELETE FROM brutesql WHERE id=?;", [key], (err, result) => {
        if(err){
            console.error(err);
        }
        typeof callback == 'function' && callback.apply(this, arguments);

    });
};


BruteSQL.defaults = {
	prefix: '',
    host: 'localhost',
    user: 'root',
    database: 'brutesql',
    create: true,
    connectionLimit: 10
};