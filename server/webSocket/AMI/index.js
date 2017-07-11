const listener = require('./listener.js');
const emitter = require('./emitter.js');

function createAMIstream(socket, ami) {
    listener(ami, socket); // ami listener
    emitter(ami, socket); // ami emitter
}

module.exports.createAMIstream = createAMIstream;