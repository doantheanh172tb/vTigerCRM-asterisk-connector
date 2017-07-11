const createAMIstream = require('./AMI').createAMIstream;

function createStream(socket, ami) {
    socket.emit('greeting', 'Hello!');
    //create emiter vs listener
    createAMIstream(socket, ami);
}

module.exports = createStream;