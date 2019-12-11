/**
 * ArticleCrawler::Plugins::[xz.aliyun.com]
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const __NAME__ = 'www.freebuf.com.model.js'
const TABLE_PREFIX = 'fb_';

const {
    Sequelize,
    sequelize
} = require("../utils/databasse");

const ArticleModel = sequelize.define(`${TABLE_PREFIX}article`, {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    nid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
    },
    url: {
        type: Sequelize.STRING(255)
    },
    title: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    content: {
        type: Sequelize.TEXT('medium')
    },
    source: {
        type: Sequelize.TEXT('medium')
    },
    author: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    nodes: {
        type: Sequelize.STRING(128),
        allowNull: false
    },
    publish: {
        type: Sequelize.BIGINT(11),
        allowNull: false
    }
})
// const CommentModel = sequelize.define(`${TABLE_PREFIX}comment`, {
//     id: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         autoIncrement: true,
//         primaryKey: true
//     },
//     nid: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         unique: true
//     },
//     username: {
//         type: Sequelize.STRING(100),
//         allowNull: false
//     },
//     comment: {
//         type: Sequelize.TEXT,
//         allowNull: false
//     },
//     publish: {
//         type: Sequelize.BIGINT(11),
//         allowNull: false
//     }
// })

ArticleModel.sync();
// CommentModel.sync();

module.exports = {
    ArticleModel,
    // CommentModel
}