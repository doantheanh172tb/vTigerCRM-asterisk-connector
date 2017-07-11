// const _ = require('lodash');

function emitter(ami, socket) {
    console.log('ready');
    ami.on('eventAny', function (data) { //lang nghe tat ca su kien tu PBX va gui di
        socket.emit('info', data);
    });

    // send an action to asterisk
    // ami.action('CoreSettings', {}, function(data){
    //     console.log(data);
    // });
}

module.exports = emitter;