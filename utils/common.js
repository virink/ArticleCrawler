/**
 * html2md - HTML to Markdown By turndown
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const TurndownService = require('turndown')
const turndownPluginGfm = require('joplin-turndown-plugin-gfm')

const turndownService = new TurndownService()
turndownService.use(turndownPluginGfm.gfm)

// HTML 转 Markdown
const html2md = (html) => {
    var markdown = turndownService.turndown(html)
    return markdown
}

// 日期字符串转时间戳
const date2ts = (date) => {
    date = date.trim().substring(0, 19).replace(/-/g, '/');
    return new Date(date).getTime();
}

// 创建不存在的文件夹
const mkdir = (path) => {
    fs.existsSync(path) || fs.mkdirSync(path);
}

module.exports = {
    html2md,
    date2ts,
    mkdir
}