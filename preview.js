/**
 * ArticleCrawler - A crawler for lots of articles
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-12-11
 */

const path = require('path')
const Koa = require('koa');
const Static = require('koa-static-prefix');
const Views = require('koa-views')
const router = require('koa-router')()

const app = new Koa();

// logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

app.use(Static(__dirname + '/data', {
    pathPrefix: '/data'
}));

// 加载模板引擎
app.use(Views(path.join(__dirname, './view'), {
    extension: 'ejs'
}))

const sites = [{
    site: 'xz.aliyun.com',
    title: '先知社区'
}, {
    site: 'www.freebuf.com',
    title: 'FreeBuf互联网安全新媒体平台'
}]

// Index - Site List
router.get('/', async (ctx, next) => {
    await ctx.render('index', {
        title: '文章镜像',
        sites: sites
    })
})
// Site - Article List
router.get('/:site', async (ctx, next) => {
    var site = ctx.params.site
    var title = ''
    sites.map(e => {
        if (e.site === site) {
            title = e.site;
        }
    });
    if (title.length > 0) {
        const model = require(`./plugins/${site}.model`)
        const nids = await model.ArticleModel.findAll({
            attributes: ['nid', 'title'],
            order: [
                ['id', 'DESC']
            ],
            raw: true
        });
        await ctx.render('site', {
            site: site,
            title: title,
            articles: nids
        })
    } else {
        ctx.body = 'Error';
    }
})

router.get('/:site/:nid', async (ctx, next) => {
    var site = ctx.params.site
    var nid = ctx.params.nid
    var title = ''
    sites.map(e => {
        if (e.site === site) {
            title = e.site;
        }
    });
    if (title.length > 0) {
        const model = require(`./plugins/${site}.model`)
        const article = await model.ArticleModel.findOne({
            where: {
                nid: nid
            },
            raw: true
        });
        if (site == 'xz.aliyun.com') {
            article.content = article.content.replace(new RegExp('https://xzfile.aliyuncs.com/media/upload/picture', 'g'), path.join('/data/xz.aliyun.com', article.nid.toString()));
        } else if (site == 'www.freebuf.com') {
            // FIX IMAGE
            article.content = article.content.replace(new RegExp('![](https://www.freebuf.com/buf/themes/freebuf/images/grey.gif)', 'g'), '');
            // article.content = article.content.replace(new RegExp('&lt;img src=&#34;https://image.3001.net/images/20191113/1573608386\_5dcb5bc279843.png!small&#34;&gt;&lt;p&gt;&lt;/p&gt;', 'g'), path.join('/data/xz.aliyun.com', article.nid.toString()));
        }
        await ctx.render('article', {
            title: title,
            article: article
        })
    } else {
        ctx.body = 'Error';
    }
})

app.use(router.routes(), router.allowedMethods())


app.listen(23000, () => {
    console.log(`Listen on http://127.0.0.1:23000/`)
});