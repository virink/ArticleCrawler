# ArticleCrawler

A crawler for lots of articles

## Usage

### Init

**MariaDB**

mysql -uroot -p -e 'create database article_crawler;'

Set your `config.js`
```js
module.exports = {
    database: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        pass: '123456',
        name: 'article_crawler'
    }
}
```

### Crawl

It's not finish Task Manager Module, so just run plugin!

Crawl **xz.aliyun.com**: `node plugins/xz.aliyun.com.js`

### Preview

```js
yarn run web
// or
node preview.js
```

## Plugins

- [x] 先知 xz.aliyun.com

## LICENSE

[MIT](LICENSE)