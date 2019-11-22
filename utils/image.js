/**
 * Debug
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Crawler = require("crawler");

var imageCrawler = new Crawler({
    encoding: null,
    jQuery: false,
    rotateUA: true,
    callback: function (err, res, done) {
        if (err) {
            console.error(err.stack);
        } else {
            var fn = res.options.filename;
            var writeStream = fs.createWriteStream(fn);
            writeStream.on('error', (err) => {
                console.error('[-] Crawl image error:', err);
            });
            writeStream.on('finish', () => {
                console.log(`[+] Crawl image [${fn}] success`);
            });
            writeStream.write(res.body);
            writeStream.end();
        }
        done();
    }
});

module.exports = {
    imageCrawler
}