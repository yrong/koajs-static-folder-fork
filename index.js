var send = require('koa-send'),
    fs = require('fs');

module.exports = serve;

/**
 * Serve static files from `root`.
 *
 * Traverses the specified folder and serves all underlying files. Can be used for public and asset folders.
 *
 * @param {String} root
 * @return {Function}
 * @api public
 */
function serve(root, opts){
    if(!root) throw Error('Root must be defined.');
    if(typeof root !== 'string') throw TypeError('Path must be a defined string.');
    opts = opts || {};
    opts.root = process.cwd();

    var rootStat = fs.statSync(root);
    if(!rootStat.isDirectory()) throw Error('Root should be a directory.');

    var finalFiles = walk(root);

    root = fs.realpathSync(root);
    if(!root) throw Error('Root must be a valid path.');

    return async function (ctx, next) {
        var filePath = finalFiles[ctx.path];
        if(!filePath){
            filePath  = '.' + ctx.path
            if(exist(filePath)){
                await send(ctx, filePath, opts)
            }else{
                await next();
            }
        }else{
            await send(ctx, filePath, opts)
        }
    }
}

function exist(path) {
    try{
        return fs.statSync(path)&&fs.statSync(path).isFile()
    }catch(e){
    }
    return false
}

function walk(directory, finalFiles) {
    var finalFiles = finalFiles || [];
    var files = fs.readdirSync(directory);
    for(var i=0; i<files.length; i++) {
        var file = files[i];
        if(!file) continue;
        file = directory + '/' + file;
        if(fs.statSync(file).isDirectory()) {
            walk(file, finalFiles);
        }
        else {
            finalFiles[file.replace('.', '')] = file;
        }
    }
    return finalFiles;
}
