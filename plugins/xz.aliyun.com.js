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
    date2ts,
    mkdir,
    matchAll
} = require('../utils/common');
const {
    imageCrawler
} = require('../utils/image');
const {
    ArticleModel,
    CommentModel
} = require('./xz.aliyun.com.model')


const dataPath = `${__dirname}/../data/xz.aliyun.com/`
mkdir(dataPath)

var AlreadCrawlIDS = [];

imageCrawler.on('request', function(options) {
    try {
        options.uri = new URL(options.uri).href
    } catch (e) {}

    // console.debug(options)
    // FIX: 修复古老文章的图片地址
    if (options.uri.indexOf('xianzhi.aliyun.com/forum/media') != -1) {
        options.uri = options.uri.replace('xianzhi.aliyun.com/forum/media', 'xzfile.aliyuncs.com/media')
    }

    // Proxy
    // options.proxy = "http://127.0.0.1:1086";
    // if (options.uri.indexOf('i.imgur.com') != -1 ||
    //     options.uri.indexOf('i.loli.net') != -1 ||
    //     options.uri.indexOf('blog.notso.pro') != -1 ||
    //     options.uri.indexOf('1.bp.blogspot.com') != -1 ||
    //     options.uri.indexOf('raw.githubusercontent.com') != -1 ||
    //     options.uri.indexOf('s2.ax1x.com') != -1) {
    //     options.proxy = "http://127.0.0.1:1086";
    // }
});

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
            data.url = res.request.uri.href
            data.title = $("span.content-title").text();
            data.author = $("span.username").text();
            data.publish = date2ts($($("span.info-left span")[2]).text());
            data.nodes = $("span.content-node a").map((_, e) => {
                return $(e).text()
            }).toArray().join();
            data.content = $("div.markdown-body").html();
            data.content = html2md(data.content);
            // Parse and Download Image
            mkdir(path.join(dataPath, data.nid))
            $("div.markdown-body img").each((_, ele) => {
                try {
                    var src = $(ele).attr("src");
                    if (src) {
                        if (src.indexOf('?') > 0) {
                            src = src.split('?')[0]
                        }
                        if (src.indexOf('#') > 0) {
                            src = src.split('#')[0]
                        }
                        var name = path.basename(src)
                        var imgDst = path.join(dataPath, data.nid, name)
                        // FIX: 修复古老文章的图片地址
                        imgDst = imgDst.replace('xianzhi.aliyun.com/forum/media', 'xzfile.aliyuncs.com/media')
                        data.content = data.content.replace('xianzhi.aliyun.com/forum/media', 'xianzhi.aliyun.com/media')
                        if (!fs.existsSync(imgDst)) {
                            imageCrawler.queue({
                                uri: src,
                                filename: imgDst,
                                isPic: true
                            })
                        }
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
                    console.error('[+] Crawled OK ', res.request.uri.href, data.title)
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
            $("a.topic-title").each(function(i, e) {
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

const initAlreadyCrawlIDs = async () => {
    (async () => {
        const nids = await ArticleModel.findAll({
            attributes: ['nid'],
            raw: true
        });
        AlreadCrawlIDS = nids.map((e) => {
            return e.nid
        })
    })();
}

const StartTask = (url = 'https://xz.aliyun.com/') => {
    console.log("[+] StartTask")
        (async () => {
            await initAlreadyCrawlIDs()
            crawlList.queue(url)
        })();
}

const StartRSSTask = (url = 'https://xz.aliyun.com/feed') => {
    console.log("[+] StartRSSTask")
    let Parser = require('rss-parser');
    let parser = new Parser();

    (async () => {
        await initAlreadyCrawlIDs()
        // TODO: Get RSS url
        let feed = await parser.parseURL(url);
        // Parser and Crawl
        feed.items.forEach(item => {
            // console.log(item.title + ':' + item.link)
            if (AlreadCrawlIDS.indexOf(parseInt(path.basename(item.link))) == -1) {
                // console.log(`[+] ${item.title} - ${item.link}`)
                crawlPage.queue(item.link)
            }
        });
    })();
}

const FixAndDownloadImage = () => {
    console.log("[+] FixAndDownloadImage");

    (async () => {
        // Get All Contents and Nid
        const articles = await ArticleModel.findAll({
            attributes: ['nid', 'content'],
            raw: true
        });
        const matchImageUrl = (nid, content) => {
            var imageUrls = matchAll(content, /\!\[(.*?)\]\((.*?)\)/)
            for (var i in imageUrls) {
                let imgUrl = imageUrls[i][2]
                if (imgUrl.indexOf('?') > 0) {
                    imgUrl = imgUrl.split('?')[0]
                }
                if (imgUrl.indexOf('#') > 0) {
                    imgUrl = imgUrl.split('#')[0]
                }
                var imgDst = path.join(dataPath, nid.toString(), path.basename(imgUrl))
                if (!fs.existsSync(imgDst)) {
                    imageCrawler.queue({
                        uri: imgUrl,
                        filename: imgDst,
                        isPic: true
                    })
                }
            }
        }
        // Grep image url
        articles.map((e) => {
            // console.log()
            matchImageUrl(e.nid, e.content)
        })
    })();
}

if (require('../utils/debug').PLUGIN_DEBUG(__NAME__)) {
    // crawlList.queue('https://xz.aliyun.com/?page=1')

    // crawlPage.queue('https://xz.aliyun.com/t/6746')
    // crawlList.queue('https://xz.aliyun.com/?page=120')

    // StartTask('https://xz.aliyun.com/?page=1')
    // imageCrawler.queue({
    //     uri: 'https://xzfile.aliyuncs.com/media/upload/picture/20190528114412-db4952ea-80fa-1.png',
    //     filename: path.join(dataPath, 'test', '20190528114412-db4952ea-80fa-1.png'),
    //     isPic: true
    // })
    StartRSSTask()
    FixAndDownloadImage()
}

module.exports = {
    StartTask,
    StartRSSTask,
    FixAndDownloadImage,
}