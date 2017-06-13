const socketIO = require('socket.io');
const { configPBXservers, connectorURL } = require('../../config.js');
const aio = require('asterisk.io');

function createWebSocket(server) {
    //create io object
    var io = socketIO(server);
    //loop all PBX config
    var AMIservers = configPBXservers.map(configPBX => {
        return {
            namespace: configPBX.company,
            server: aio.ami( //tao ket noi den PBX qua AMI
                configPBX.asterisk.ASTERISK_SERVER_IP,
                configPBX.asterisk.ASTERISK_SERVER_PORT,
                configPBX.asterisk.ASTERISK_USERNAME,
                configPBX.asterisk.ASTERISK_PASSWORD
            )
        };
    });
    AMIservers.forEach(function (AMI) {
        /**
        * // error throw if
        * // - could not connect to hostname
        * // - could not log in with username/password
        * // - asterisk server close socket
        */
        AMI.server.on('error', function (err) {
            console.log(AMI.namespace, "Err: " + err);
        });
        // connected and logged with asterisk ami
        AMI.server.on('ready', function () {
            console.log(AMI.namespace, "is ready to connect");
        });
    });
}
module.exports = createWebSocket;