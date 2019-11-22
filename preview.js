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

// Index - Site List
router.get('/', async (ctx, next) => {
    await ctx.render('index', {
        title: '文章镜像',
        sites: [{
            site: 'xz.aliyun.com',
            title: '先知社区'
        }]
    })
})
// Site - Article List
router.get('/:site', async (ctx, next) => {
    var site = ctx.params.site
    if (site == 'xz.aliyun.com') {
        const xz = require(`./plugins/${site}.model`)
        const nids = await xz.ArticleModel.findAll({
            attributes: ['nid', 'title'],
            raw: true
        });
        await ctx.render('site', {
            title: '先知社区',
            articles: nids
        })
    } else {
        ctx.body = 'Error';
    }
})

router.get('/:site/:nid', async (ctx, next) => {
    var site = ctx.params.site
    var nid = ctx.params.nid
    if (site == 'xz.aliyun.com') {
        const xz = require(`./plugins/${site}.model`)
        const article = await xz.ArticleModel.findOne({
            where: {
                nid: nid
            },
            raw: true
        });
        await ctx.render('article', {
            title: '先知社区',
            article: article
        })
    } else {
        ctx.body = 'Error';
    }
})

app.use(router.routes(), router.allowedMethods())


app.listen(3000, () => {
    console.log(`Listen on http://127.0.0.1:3000/`)
});