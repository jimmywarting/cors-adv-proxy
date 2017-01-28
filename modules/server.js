const restify = require('restify')
var proxy = require('./proxy')

const server = restify.createServer({
    name: 'cors-adv-proxy'
})

const freeTier = restify.throttle({
    rate: 3,
    burst: 100,
    xff: true,
    overrides: {
        '192.168.1.1': {
            rate: 0,        // unlimited
            burst: 0
        }
    }
})

// server.use(restify.CORS())
server.use(restify.queryParser())

server.opts('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, HEAD, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'))
  res.send(200)
  return next()
})

server.use(freeTier)
server.get('/', proxy.get)
server.post('/', proxy.get)
server.del('/', proxy.get)
server.put('/', proxy.get)
server.head('/', proxy.get)

module.exports = server
