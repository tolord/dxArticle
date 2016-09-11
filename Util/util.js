/**
 * Created by liao on 16/4/15.
 */
    //文件夹的处理
var fs = require('fs');
function dir(path) {
    var dirs = fs.readdirSync(path);
    var array = [];
    for(var i=0;i<dirs.length;++i) {
        var stat = fs.lstatSync(path+'/'+dirs[i]);
        if(stat.isDirectory()) {
            array.push(dirs[i]);
        }
    }
    //console.log(array);
    return array;
}
exports.dir =dir;


function file(path) {
    var dirs = fs.readdirSync(path);
    var array = [];
    for(var i=0;i<dirs.length;++i) {
        var stat = fs.lstatSync(path+'/'+dirs[i]);
        if(!stat.isDirectory()) {
            array.push(dirs[i]);
        }
    }
    return array;
}

exports.file = file;

function earlierFile(array) {
    var min = array[0];
    for(var i=1;i<array.length;++i) {
        if(min>array[i]) {
            min = array[i];
        }
    }
    return min;
}
exports.earlierFile = earlierFile;

function isDirExist(path,dirName) {
    var array = dir(path);
    for(var i=0;i<array.length;++i) {
        if(array[i] == dirName) {
            return true;
        }
    }
    return false;
}

exports.isDirExist = isDirExist;

function allDir(path) {
    var level1Dir = dir(path);
    var mp = new Map();
    for(var i=0;i<level1Dir.length;++i) {
        var array = dir(path + '/' + level1Dir[i]);
        mp.set(level1Dir[i],array);
    }
    //console.log(mp);
    return mp;
}
exports.allDir = allDir;
function isFileExist(path) {
    var stat = fs.lstatSync(path);
    if(stat.isFile()) {
        console.log('is file');
    } else {
        console.log('not a file');
    }
}
exports.isFileExist = isFileExist;




//文件的加密和压缩

/////------------------------//////

//加密一个字符串，并把该字符串存在path路径下，起名为key
var private_key = fs.readFileSync('ssl/rsa_private_key.pem','utf-8');
var crypto = require('crypto');
function cryptStr(md5Str,path) {
    console.log(md5Str);
    //md5Str = 'xuexibao';
    var buffer = crypto._toBuf(md5Str);//这是原始的buffer：<Buffer 68 65 6c 6c 6f 2c 77 6f 72 6c 64>
    console.log('原始的buffer',buffer);
    var cryptBuffer =crypto.privateEncrypt(private_key,buffer);//这是生成的加密buffer
//<Buffer 2f ad 98 8c f1 2f ee ee 38 2a 07 d0 6c f2 4e 67 77 c2 3d 3c 0d 96 fa b......
    console.log('加密后的buffer = ',cryptBuffer);
    //fs.writeFileSync('source/key',cryptBuffer);
    fs.writeFileSync(path,cryptBuffer);
    return cryptBuffer;

}
exports.cryptStr = cryptStr;

var public_key = fs.readFileSync('ssl/rsa_public_key.pem','utf-8');

//这是文件的解密
function decryptStr(cryptBuffer) {
    var result = crypto.publicDecrypt(public_key,cryptBuffer);
    console.log('解密后的buffer = ',result);
    return result;
}
exports.decryptStr = decryptStr;

//传入最终的文件路径，被压缩的文件1路径，被压缩的文件2路径，压缩包内文件1名字，压缩包内文件2名字。
var archiver = require('archiver');
function archiveData(finalPath,file1Path,file2Path,file1Name,file2Name) {
    var archive = archiver('zip');
    var output = fs.createWriteStream(finalPath);
    output.on('close',function() {
        console.log(archive.pointer() + 'totla bytes');
    });
    archive.on('error',function(error) {
        console.log(error);
    });

    archive.pipe(output);
    archive
        .append(fs.createReadStream(file1Path),{name:file1Name})
        .append(fs.createReadStream(file2Path),{name:file2Name})
        .finalize();

}
exports.archiveData = archiveData;


var crypto = require('crypto');
function md5Digest(filePath) {
    var file = fs.readFileSync(filePath);
    var MD5 = crypto.createHmac('md5',file);
    var hash = crypto.createHash('md5');
    hash.update(file);
    var newMD5 = hash.digest('hex');
    console.log('newMD5 == ',newMD5);
    var oldMD5 = MD5.digest('hex');
    console.log('oldMD5 == ',oldMD5);

    return newMD5;
}
exports.md5Digest = md5Digest;
var nickNames = ['宋 江','卢俊义','吴 用','公孙胜','关 胜','林 冲','秦 明','呼延灼','花 荣','柴 进'];
var nickNameCount = nickNames.length;
function randomNickName() {
    return nickNames[0];//???暂时默认用松江
}
exports.randomNickName = randomNickName;

var arrayBeginSymbol = '0x00';
var arraySeperator = ',,,';
function getEmptyArray() {
    return arrayBeginSymbol;
}
exports.getEmptyArray = getEmptyArray;
function addObj(arrayStr,str) {
    if(arrayStr.length == 0) {
        arrayStr = arrayBeginSymbol;
    }
    arrayStr = arrayStr + arraySeperator + str;
    return arrayStr;
}
exports.addObj = addObj;

function strConvertArray(arrayStr) {
    var realArray = arrayStr.split(arraySeperator);
    return realArray;
}
exports.strConvertArray = strConvertArray;
function arrayConvertTrueArray(array) {
    if(array.length == 1) {
        return [];
    }
    array.splice(0,1);
    return array;
}
exports.arrayConvertTrueArray = arrayConvertTrueArray;
function strArrayConvertTrueArray(strArray) {
    var array = strConvertArray(strArray);
    return arrayConvertTrueArray(array);
}
exports.strArrayConvertTrueArray = strArrayConvertTrueArray;

function arrayConvertStr(array) {
    return array.join(arraySeperator);
}
exports.arrayConvertStr = arrayConvertStr;



function getArrayCount(arrayStr) {
    return strConvertArray(arrayStr).length;
}
exports.getArrayCount = getArrayCount;

function removeObj(arrayStr,str) {
    var str1 = arraySeperator + str;
    var index = arrayStr.indexOf(str1);
    if(index == -1) {
        return arrayStr;
    }
    return arrayStr.replace(str1,'');
}
exports.removeObj = removeObj;












