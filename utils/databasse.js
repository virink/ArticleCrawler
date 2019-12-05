/**
 * database - Sequelize - MySQL
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';
const Sequelize = require('sequelize');
var fs = require("fs")
var path = require("path")
const CONFIG = require('../config').database;

var plugin_path = path.join(`${__dirname}/../plugins/`)
var plugin_models = [];

//初始化链接（支持连接池）
var sequelize = new Sequelize(CONFIG.name, CONFIG.user, CONFIG.pass, {
    host: CONFIG.host,
    port: CONFIG.port,
    dialect: 'mariadb', // 'mysql' | 'sqlite' | 'postgres' | 'mssql',
    pool: {
        max: 10,
        min: 0,
        idle: 10000
    },
    dialectOptions: {
        timezone: 'Etc/GMT-8',
        useUTC: false,
        charset: "utf8mb4",
        collate: "utf8mb4_bin"
    },
    'define': {
        'underscored': true,
        'charset': 'utf8mb4'
    },
    timezone: 'Etc/GMT-8',
    benchmark: false,
    logging: false
    // SQLite only
    // storage: '../data/database.sqlite'
});

// 测试连接是否成功
sequelize
    .authenticate()
    .then(() => {
        console.log('[+] Connect database successfully.')
    })
    .catch(err => {
        console.error('[-] Unable to connect to the database')
        console.error('[-]  ', err.toString())
    })

module.exports = {
    Sequelize,
    sequelize
}