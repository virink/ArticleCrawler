/**
 * ArticleCrawler::Plugins::[www.freebuf.com]
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const __NAME__ = 'www.freebuf.com.js'
const INDEX_URL = 'https://www.freebuf.com';

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
    ArticleModel
} = require('./www.freebuf.com.model')


const dataPath = `${__dirname}/../data/www.freebuf.com/`
mkdir(dataPath)

var AlreadCrawlIDS = [];

imageCrawler.on('request', function (options) {
    try {
        options.uri = new URL(options.uri).href
    } catch (e) { }
    // Proxy
    // options.proxy = "http://127.0.0.1:1086";
});

// Get Page
var crawlPage = new Crawler({
    maxConnections: 2,
    callback: (err, res, done) => {
        if (err) {
            console.log("[-] Crawl Page error: ", err.toString());
        } else {
            var $ = res.$;
            // Get Page
            var data = {};
            data.nid = /\/(\d+).html/.exec(res.request.uri.path)[1]
            data.url = res.request.uri.href
            data.title = $(".title h2").text().trim();
            data.author = $(".articlecontent .name a[rel=author]").text().trim();
            data.source = $(".articlecontent #contenttxt").html();
            var tmp = data.source;
            console.log(res.body)
            console.log(data)
            tmp = tmp.replace(new RegExp('src="https://www.freebuf.com/buf/themes/freebuf/images/grey.gif"', 'g'), '').replace(new RegExp('data-original', 'g'), 'src');
            data.content = html2md(tmp);
            data.nodes = $(".newlabelDiv a[rel=tag]").map((_, e) => {
                return $(e).text().trim().replace(/# /g, '')
            }).toArray().join();
            data.publish = date2ts($(".articlecontent .time").text().trim());
            // Parse and Download Image
            mkdir(path.join(dataPath, data.nid))
            // console.debug($("#contenttxt img").html())
            $("#contenttxt img").map((_, ele) => {
                try {
                    var src = $(ele).attr("data-original") || $(ele).attr("src");
                    if (src) {
                        ['?', '!', '#'].map(c => {
                            if (src.indexOf(c) > 0) {
                                src = src.split(c)[0]
                            }
                        })
                        var name = path.basename(src)
                        var imgDst = path.join(dataPath, data.nid, name)
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
            $("a.topic-title").each(function (i, e) {
                var pageLink = `${INDEX_URL}${$(e).attr("href")}`;
                // console.debug($(e).text(), pageLink);
                var nid = /\/(\d+).html/.exec(pageLink)[1]
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
    console.log("[+] StartTask");
    (async () => {
        await initAlreadyCrawlIDs()
        crawlList.queue(url)
    })();
}

const StartRSSTask = (url = 'https://www.freebuf.com/feed') => {
    console.log("[+] StartRSSTask");
    let Parser = require('rss-parser');
    let parser = new Parser({
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3683.103 Safari/524.63' },
    });

    (async () => {
        await initAlreadyCrawlIDs()
        // TODO: Get RSS url
        let feed = await parser.parseURL(url);
        // Parser and Crawl
        feed.items.forEach(item => {
            // console.log(item.title + ':' + item.link)
            let nid = /\/(\d+).html/.exec(item.link)
            if (AlreadCrawlIDS.indexOf(parseInt(nid)) == -1) {
                console.log(`[+] ${item.title} - ${item.link}`)
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
                ['?', '!', '#'].map(c => {
                    if (imgUrl.indexOf(c) > 0) {
                        imgUrl = imgUrl.split(c)[0]
                    }
                })
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
    crawlPage.queue('https://www.freebuf.com/news/222454.html')
    // crawlList.queue('')
    // StartTask('')
    // StartRSSTask()
    // FixAndDownloadImage()
}

module.exports = {
    StartTask,
    StartRSSTask,
    FixAndDownloadImage,
}