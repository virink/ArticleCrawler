/**
 * Debug
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const fs = require('fs');
const Crawler = require("crawler");

var imageCrawler = new Crawler({
    encoding: null,
    jQuery: false,
    rotateUA: true,
    callback: function (err, res, done) {
        if (err) {
            console.error(err.toString());
        } else {
            var ws = fs.createWriteStream(res.options.filename);
            ws.on('error', (e) => {
                console.error('[-] Crawl image error:', e.toString());
            });
            ws.on('finish', () => {
                console.log(`[+] Crawl image ok ${res.options.filename}`);
            });
            ws.write(res.body);
            ws.end();
        }
        done();
    }
});

module.exports = {
    imageCrawler
}