const restify = require('restify');
const plugins = require('restify-plugins');
var proxy = require('./proxy');

const server = restify.createServer();

const freeTier = plugins.throttle({
    rate: 3,
    burst: 10,
    ip: true,
    overrides: {
        '192.168.1.1': {
            rate: 0,        // unlimited
            burst: 0
        }
    }
});

server.pre(freeTier, proxy.get)

module.exports = server;
