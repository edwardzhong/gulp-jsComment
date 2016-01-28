var through = require('through2');
var gutil = require('gulp-util');
var fs = require('fs');

// 配置常量
// const CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))||'';

// 插件级别的函数（处理文件）
function pluginInit() {

    // 创建一个 stream 通道，以让每个文件通过
    var stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('jsComment', 'Streams are not supported!'));
            return cb();
        }

        file.contents = new Buffer(addFunctionDoc(file));
        // 确保文件进入下一个 gulp 插件
        this.push(file);
        // 告诉 stream 引擎，我们已经处理完了这个文件
        cb();
    });

    // 返回文件 stream
    return stream;
};

/**
 * 对js文件中的函数添加注释
 * @Author   jeffzhong(p_jdjfzhong)
 * @DateTime 2016-01-28T16:59:00+0800
 * @param    {Object}                 file Buffer对象
 */
function addFunctionDoc(file) {
    var content = file.contents.toString();
    //匹配使用modulejs打包的代码
    var amdRegexp=new RegExp("([\\S\\s]*?)(define\\([\\S\\s]*?function\\([\\S\\s]*?\\)[\\S\\s]*?\{)([\\S\\s]*)(\\}\\)\\;?)","i");
    //匹配最外层使用了立即执行函数的js
    // var imRegex=new RegExp("([\\S\\s]*?)([\\(\\!\\~\\-\\+]function\\s*\\(\\s*\\)[\\S\\s]*?\\{)([\\S\\s]*)(\\}\\s*\\)?\\(\\)\\)?\\;?)","i");
    //匹配每一行
    var lineRegexp=/(.*?)\r\n/g;
    //匹配正常函数function aa(a,b){ } “{”之前的部分
    var funRegexp=/^([\s\t]*?)function\s+(\w+)\s*?\((.*?)\)\s*?(\{?)/i;
    //匹配函数表达式 var aa=function(a,b){ } “{”之前的部分
    var expressFunRegexp=/^([\s\t]*?)var\s+(\w+)\s*?\=[\s\(]*?function\s*?\((.*?)\)\s*?(\{?)/i;
    //匹配立即执行函数(自执行函数) (function(a,b){ }())“{”之前的部分
    var imFunRegexp=/^([\s\t]*?)[\(\!\~\-\+]\s*function\s*(\w*)\((.*?)\)\s*?(\{?)/i;
    //匹配前一行是否已经注释
    var commentRegexp=/^[\s\t]*\/{2,}|\*\/[\s\t]*$/;
    var hadAnalyze=[],
        centerCodes='',
        endBlock='',
        match=null,
        lastLine='';

    //匹配出module.js打包的文件
    if(amdRegexp.test(content)){
        //没有文件说明，则添加文件说明
        if(!commentRegexp.test(RegExp.$1)){
            hadAnalyze=hadAnalyze.concat(addFileComment());
        }
        hadAnalyze=hadAnalyze.concat([RegExp.$1,RegExp.$2]);
        centerCodes=RegExp.$3;
        endBlock=RegExp.$4;
    } else {
        centerCodes=content;
    }

    //逐行扫描
    while(lineMatch=lineRegexp.exec(centerCodes)){
        //如果是函数
        if((match=lineMatch[0].match(funRegexp))||(match=lineMatch[0].match(expressFunRegexp))||(match=lineMatch[0].match(imFunRegexp))){
            //没有注释过，则添加注释
            if(!commentRegexp.test(lastLine)){
                hadAnalyze=hadAnalyze.concat(addFnctionComment(match));
            }
        }
        lastLine=lineMatch[0];
        hadAnalyze.push(lineMatch[0]);
    }

    hadAnalyze.push(endBlock);

    return hadAnalyze.join('');
}

/**
 * 添加文件头注释
 * @Author   jeffzhong(p_jdjfzhong)
 * @DateTime 2016-01-28T17:06:13+0800
 */
function addFileComment(){
    var commnet=[];
    commnet.push('/**');
    commnet.push('\n * [description]');
    commnet.push('\n * @Author    xxxx');
    commnet.push('\n * @DateTime  '+formatDate(new Date()));
    commnet.push('\n */\n');
    return commnet;
}

/**
 * 添加函数注释
 * @Author   jeffzhong(p_jdjfzhong)
 * @DateTime 2016-01-28T16:49:55+0800
 * @param    {Object}                 match 正则match后的对象
 */
function addFnctionComment(match){
    var commnet=[],
        tabPos=match[1],//函数前面的空格
        fnName=match[2],//函数名
        args=match[3]?match[3].trim().split(/\s*\,\s*/g):[],//参数
        isCb=false,
        t='',spaces='';

    commnet.push('\n'+tabPos+'/**');
    commnet.push('\n'+tabPos+' * ['+fnName+' description]');
    commnet.push('\n'+tabPos+' * @Author    xxxx');
    commnet.push('\n'+tabPos+' * @DateTime  '+formatDate(new Date()));
    args.forEach(function(item,i){
        isCb=/^callback/i.test(item);
        t=isCb?'Function':'type';
        spaces=isCb?new Array(2).join(' '):new Array(6).join(' ');
        commnet.push('\n'+tabPos+' * @param     {'+t+'}'+spaces+item+' [description]');
    });
    commnet.push('\n'+tabPos+' * @return    {type}      [description]');
    commnet.push('\n'+tabPos+' */');
    commnet.push('\n');
    return commnet;
}

/**
 * 格式化时间
 * @Author   jeffzhong(p_jdjfzhong)
 * @DateTime 2016-01-27T10:31:53+0800
 * @param    {[type]}                 d [description]
 */
function formatDate(d){
    var year=d.getFullYear();
    var mon=d.getMonth()+1;
    var day=d.getDate();
    var h=d.getHours();
    var m=d.getMinutes();
    var s=d.getSeconds();
    return year+'-'+('0'+mon).slice(-2)+'-'+('0'+day).slice(-2)+' '+('0'+h).slice(-2)+':'+('0'+m).slice(-2)+':'+('0'+s).slice(-2);
}

module.exports = pluginInit;
