/**
 * ArticleCrawler::Plugins::[xz.aliyun.com]
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const __NAME__ = 'xz.aliyun.com.js'
const INDEX_URL = 'https://xz.aliyun.com';

const path = require("path");
const fs = require('fs');
const Crawler = require("crawler");

const {
    html2md,
    date2ts
} = require('../utils/common');
const {
    imageCrawler
} = require('../utils/image');
const {
    ArticleModel,
    CommentModel
} = require('./xz.aliyun.com.model')

const mkdir = (path) => {
    fs.existsSync(path) || fs.mkdirSync(path);
}

const dataPath = `${__dirname}/../data/xz.aliyun.com/`
mkdir(dataPath)

var AlreadCrawlIDS = [];

// Get Page
var crawlPage = new Crawler({
    maxConnections: 5,
    callback: (err, res, done) => {
        if (err) {
            console.log("[-] Crawl Page error: ", err.toString());
        } else {
            var $ = res.$;
            // Get Page
            var data = {};
            data.nid = /\/t\/(\d+)/.exec(res.request.uri.path)[1]
            data.title = $("span.content-title").text();
            data.author = $("span.username").text();
            data.publish = date2ts($($("span.info-left span")[2]).text());
            data.nodes = $("span.content-node a").map((_, e) => {
                return $(e).text()
            }).toArray().join();
            data.content = $("div.markdown-body").html();
            data.content = html2md(data.content);
            // Parse and Replace Image Url
            mkdir(path.join(dataPath, data.nid))
            $("div.markdown-body img").each((_, ele) => {
                try {
                    var src = $(ele).attr("src");
                    if (src) {
                        var name = path.basename(src)
                        imageCrawler.queue({
                            uri: src,
                            filename: path.join(dataPath, data.nid, name)
                        })
                        data.content = data.content.replace(src, path.join('data/xz.aliyun.com', data.nid, name))
                    }
                } catch (e) {
                    console.error('[-] Crawl ', res.request.uri.href)
                    console.error("[-] Parse Image ", src, " error:")
                    console.error("[-]  ", e.toString())
                    console.error(ele)
                }
            });
            // TODO: crawl comments
            // Save in database
            (async (data) => {
                try {
                    await ArticleModel.create(data);
                    console.error('[+] Crawled successfully ', res.request.uri.href)
                } catch (e) {
                    console.error('[+] Insert error', e.toString())
                }
            })(data);
        }
        done();
    }
});

// Get List
var crawlList = new Crawler({
    rateLimit: 1000,
    callback: (err, res, done) => {
        if (err) {
            console.log("[-] Crawl List error: ", err.toString());
        } else {
            console.error('[+] Crawl List: ', res.request.uri.href)
            var $ = res.$;
            var pageLinks = [];
            // Get Page Link
            $("a.topic-title").each(function (i, e) {
                var pageLink = `${INDEX_URL}${$(e).attr("href")}`;
                // console.debug($(e).text(), pageLink);
                var nid = /\/t\/(\d+)/.exec(pageLink)[1]
                // console.log(nid)
                // Pass Alread Crawled
                if (AlreadCrawlIDS.indexOf(parseInt(nid)) == -1) {
                    pageLinks.push(pageLink);
                }
            });
            // console.log(pageLinks)
            crawlPage.queue(pageLinks)
            // Get Next Page
            var nextPage = $("div.pagination a").last().attr("href") || '';
            if (nextPage.length > 0 && nextPage.indexOf('page=') != -1) {
                // console.debug(`${INDEX_URL}/${nextPage}`)
                crawlList.queue(`${INDEX_URL}/${nextPage}`)
            }
        }
        done();
    }
});

const StartTask = () => {
    (async () => {
        const nids = await ArticleModel.findAll({
            attributes: ['nid'],
            raw: true
        });
        AlreadCrawlIDS = nids.map((e) => {
            return e.nid
        })
        crawlList.queue('https://xz.aliyun.com/')
    })();
}

if (require('../utils/debug').PLUGIN_DEBUG(__NAME__)) {
    // crawlList.queue('https://xz.aliyun.com/?page=1')

    // crawlPage.queue('https://xz.aliyun.com/t/6746')
    // crawlList.queue('https://xz.aliyun.com/?page=120')

    StartTask()
}

module.exports = {
    StartTask
}