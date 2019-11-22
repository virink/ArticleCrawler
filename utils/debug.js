/**
 * Debug
 * Author: Virink < virink @outlook.com >
 * Create: 2019-11-22
 * Update: 2019-11-22
 */

'use strict';

const path = require('path');

const PLUGIN_DEBUG = (name) => {
    return (process.env.DEBUG || path.basename(process.argv[1]) == name) ? true : false;
}

// ((path) => {
//     fs.readdirSync(path).forEach((f, _) => {
//         if (fs.statSync(path + "/" + f).isFile() && f.indexOf('.model.js') > 0) {
//             console.debug(f)
//             plugin_models.push(f)
//             require(path + "/" + f)
//         }
//     })
// })(plugin_path)


module.exports = {
    PLUGIN_DEBUG
}