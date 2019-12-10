/**
 * ArticleCrawler - A crawler for lots of articles
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

// TODO: Manage Task

const plugins = [
    'xz.aliyun.com'
]

var pluginsHandler = {}

plugins.map(plugin => {
    console.log(plugin)
    pluginsHandler[plugin] = require(`./plugins/${plugin}`)
})

// console.debug(pluginsHandler)
for (var plugin in pluginsHandler) {
    console.log(`[+] ${plugin}`)
    pluginsHandler[plugin].StartRSSTask()
}