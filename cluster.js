/**
 * Created by liao on 16/4/27.
 */
var cluster = require('cluster');
if (cluster.isMaster) {
    for (var i=0;i<2;++i) {
        var worker = cluster.fork();
    }
} else {
    require('./app.js');
    console.log('worker is running');
}

cluster.on('death',function(worker) {
    console.log('worker '+ worker.pid + 'died,restart...');
    cluster.fork();
});

