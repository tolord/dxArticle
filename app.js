

var express = require('express');

var app = express();
//新添加代码1
app.use(express.static('source'));
app.use(express.static('YS'));
//新添加代码3
app.use(express.static('views'));

//app.use(express.limit('4M'));
app.listen(8080);
//必须要body-parser，不然无法解析request的body参数
var bodyParser = require('body-parser');
app.use(bodyParser.json());
//app.use(express.bodyp)
//现在暂时用x-www-form-urlencoded的表单形式，这个在postman里面对应的是post的body的x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended:true}));
var fs = require('fs');
var https = require('https');
var options = {
   // key:fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
   // cert:fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
	key:fs.readFileSync(__dirname + '/ssl/key3/server_nopwd.key'),
	cert:fs.readFileSync(__dirname + '/ssl/key3/server.crt')
};

https.createServer(options,app).listen(8081);

var redis = require('redis');
var client = redis.createClient('6379','127.0.0.1');
//监听错误
client.on('error',function(err) {
    console.log(err);
});

var formidable = require('formidable');
var util = require('./Util/util');

//



//杜希的网站begin

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


//0.验证本地接口是否可用
var kArticle = '/article/';
app.get(kArticle,function(req,res) {
    console.log(kArticle);
    res.send({'success' : 'yes'});
});


//1.添加文章到到服务端
var addArticle = kArticle + 'addArticle';
app.post(addArticle,function(req,res) {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = 'source';
    form.maxFieldsSize = 1 * 1024 * 1024;//限定Fields大小为1M
    form.parse(req,function(error,fields,files) {
        if (error) {
            res.send({'success' : 'no','data' : '解析数据失败'});
            return;
        }
        var articleID = fields.articleID;
        var editTime = fields.editTime;
        var title = fields.title;
        var content = fields.content;
        var module = '00' + fields.module;//为啥要加上00呢，为了转化为字符串
        if (!(articleID && editTime && title && content && module)) {
            res.send({'success' : 'no','data' : '参数不全'});
            return;
        }
        var info = {};
        info.editTime = editTime;
        info.title = title;
        info.module = module;
        info.articleID = articleID;
        info.content = content;

        //先判断这次有没有图片上传
        if(files.files) {
            info.filePath = files.files.path;
        }
        console.log('filePath == ',info.filePath);
        client.hgetall(articleID,function(error,result) {
            if(result) {
                if(result.filePath) {
                    if(info.filePath) {
                        fs.unlink(result.filePath,function(error) {
                            console.log('删除旧的图片 error = ',error);
                        });
                    } else {
                        info.filePath = result.filePath;
                    }
                }
            }
            client.hmset(articleID,info,function(error) {
                if(error) {
                    res.send({'success' : 'no','data' : '保存数据失败'});
                    return;
                }

                client.sadd(module,articleID,function(error) {
                    if(error) {
                        res.send({'success' : 'no', 'data' : '关联数据到模块失败'});
                        return;
                    }
                    //client.smembers(module,function(error,result) {
                    //    console.log('module members === ',result);
                    //});
                    res.send({'success' : 'yes','data' : '恭喜你，数据保存成功了'});
                });
            })
        })

    })
})
//2.删除数据库里面的文章
var deleteArticle = kArticle + 'deleteArticle';
app.post(deleteArticle,function(req,res) {
    console.log(deleteArticle);
    var articleID = req.body.articleID;
    var module = '00' + req.body.module;
    if(!(articleID && module)) {
        res.send({'success' : 'no','data' : '参数给的不全'});
        return;
    }
    //删除articleID对应的东西
    client.hgetall(articleID,function(error,result) {
        if(error) {
            res.send({'success' : 'no','data' : '没有这条记录可以删除'});
            return;
        }
        if(!result) {
            res.send({'success' : 'no', 'data' : '没有记录可以删除'});
            return;
        }
        client.del(articleID,function(error) {
            if(error) {
                res.send({'success' : 'no','data' : '删除失败'});
                return;
            }
            var filePath = result.filePath;
            if(filePath) {
                fs.unlink(filePath,function(error) {
                    console.log('error === ',error);
                });
            }

            //删除module对应的东西
            client.srem(module,articleID,function(error,result) {
                if(error) {
                    res.send({'success' : 'no','data' : '取消关联失败'});
                    return;
                }
                res.send({'success' : 'yes','data' : '取消关联成功'});
            })
        });
    })
})

//3.找出一个模块中所有的数据ID

var moduleArticleID = kArticle + 'moduleArticleID';
app.post(moduleArticleID,function(req,res) {
    var module = '00' + req.body.module;
    if(!module) {
        res.send({'success' : 'no','data' : '参数不全'});
        return;
    }
    client.smembers(module,function(error,result) {
        if(error) {
            res.send({'success' : 'no','data' :'获取模块数据ID失败'});
            return;
        }
        res.send({'success' : 'yes','data' : result});
    })
})

//4.依据数据ID，获取到数据
var articleInfo = kArticle + 'articleInfo';
app.post(articleInfo,function(req,res) {
    var articleID = req.body.articleID;
    if(!articleID) {
        res.send({'success' : 'no','data' : '参数不全'});
        return;
    }
    client.hgetall(articleID,function(error,result) {
        if(error) {
            res.send({'success' : 'no','data' : 'redis数据库错误'});
            return;
        }
        if(!result) {
            res.send({'success' : 'no','data' : '找不到这条数据'});
            return;
        }
        res.send({'success' : 'yes','data' : result});
    })
})

////5.依据图片路径，获取到图片---这个接口废弃不用了。
//var articleImg = kArticle + 'articleImg';
//app.post(articleImg,function(req,res) {
//    var filePath = req.body.filePath;
//    var fileName = filePath.substring(7);
//    if(!filePath) {
//        res.send({'success' : 'no','data' : '参数不全'});
//        return;
//    }
//    if(!fileName) {
//        res.send({'success' : 'no'});
//        return;
//    }
//    var options = {
//        root : __dirname + '/source',
//        dotfiles : 'deny',
//        headers : {
//            'x-timestamp' : Date.now(),
//            'x-sent' : true
//        }
//    };
//    console.log('fileName = ',fileName);
//    res.sendFile(fileName,options,function(error) {
//        if(error) {
//            res.send({'success' : 'no','data' : '数据发送失败'});
//            return;
//        }
//    })
//})

//新添加代码2
//使用express来托管静态文件，包括图片，图片是放在source里面的。
//你要使用的时候，直接使用get请求的URL就可以了。然后后面加上这个文件的名字就行了。这个文件的名字，不带有source/
//如下
http://localhost:8080/upload_7624a8bc93f55f9969db35b57c77f7d0

//再比如，我本地的source目录下存了一个文件叫做6.png，那我访问的时候，直接访问
//    http://localhost:8080/6.png就可以了。
//6.登陆验证

var login = kArticle + 'login';
app.post(login,function(req,res) {
    var userName = req.body.userName;
    var password = req.body.password;
    if(!(userName && password)) {
        res.send({'success' : 'no','data' : '参数不全'});
        return;
    }
    client.get(userName,function(error,result) {
        if(error) {
            res.send({'success' : 'no','data' : '数据库错误'});
            return;
        }
        if(!result) {
            res.send({'success' : 'no','data' : '数据库中没有这个用户'});
            return;
        }
        if(result !== password) {
            res.send({'success' : 'no','data' : '密码不对'});
            return;
        }
        res.send({'success' : 'yes','data' : '验证通过'});
    })
})

//7.修改密码
var resetPassword = kArticle + 'resetPassword';
app.post(resetPassword,function(req,res) {
    var userName = req.body.userName;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    if(!(userName && oldPassword && newPassword)) {
        res.send({'success' : 'no','data' : '参数不全'});
        return;
    }
    client.get(userName,function(error,result) {
        if(error) {
            res.send({'success' : 'no','data' : '数据库错误'});
            return;
        }
        if(!result) {
            res.send({'success' : 'no','data' : '数据库中没有这个用户'});
            return;
        }
        if(result !== oldPassword) {
            res.send({'success' : 'no','data' : '老密码不对'});
            return;
        }
        client.set(userName,newPassword,function(error) {
            if(error) {
                res.send({'success' : 'no','data' : '密码修改失败'});
                return;
            }
            res.send({'success' : 'yes','data' : '密码保存成功'});
        })
    })
})

//n.初始化账号密码

var defaultUserName = 'YSadmin1';
var password = 'yishanfofs1';
client.get(defaultUserName,function(error,result) {
    if(error) {
        console.log('redis错误');
        return;
    }
    if(!result) {
        client.set(defaultUserName,password,function(error) {
            if(error) {
                console.log('初始化密码失败,error = ',error);
                return;
            }
            console.log('初始化账号密码成功');
        });
    }
})


//杜希的网站end
//
////设定静态目录
//var express = require('express');
//var app = express();
//var pathname = __dirname;
//
////app.use(express.static('source'));
//console.log(pathname);
//app.use(express.static('source'));
//app.get('/hello/',function(req,res) {
//    console.log('hello,world');
//    res.send('hello,world');
//})
//
//app.listen(3000);
//console.log('3000');

