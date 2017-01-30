const request = require('request')
const URLSearchParams = require('url-search-params')
const Headers = require('fetch-headers')
const urlParser = require('url').parse

/*
  get handler handles standard GET reqs as well as streams
*/
function get (req, res, next) {
  if(req.method.toLowerCase() === 'options') return opts(req, res);

  let {url} = req
  let search = url.substr(url.indexOf('?') + 1)
  let params = new URLSearchParams(search)
  let resHeaders = new Headers
  let reqHeaders = new Headers
  let method = params.get('_method') || req.method


  url = params.get('url')
  if (!url) {
    res.statusCode = 403;
    return res.end('url search param is required');
  }

  if (!params.has('ignoreReqHeaders')) {
    for (let header in req.headers) {
      if(header.toLowerCase() !== 'host') {
        reqHeaders.append(header, req.headers[header])
      }
    }
  }

  let forwardedFor = reqHeaders.get('X-Fowarded-For')
  reqHeaders.set('X-Fowarded-For', (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress)

  if (params.has('reqHeadersSet')) {
    try {
      let h = new Headers(JSON.parse(params.get('reqHeadersSet')))
      for (let [key, val] of h) {
        reqHeaders.set(key, val)
      }
    } catch (e) {
      console.log(e)
    }
  }

  if (params.has('reqHeaderDelete')) {
    try {
      let keys = JSON.parse(params.get('reqHeaderDelete'))
      for (let key of keys) {
        reqHeaders.delete(key)
      }
    } catch (e) {
      console.log(e)
    }
  }


  let headers = Object.create(null)

  for (let [k,v] of reqHeaders) {
    headers[k] = v
  }

  request({url, headers, method, followRedirect: false}) // GET the document that the user specified
    .on('response', page => {
      res.statusCode = 200 // page.statusCode;

      // include only desired headers
      let responseHeaders = new Headers
      for (let header in page.headers) {
        if (header === 'location') key = 'location'
        else if (header === 'set-cookie') key = 'set-cookie'
        else key = header

        responseHeaders.append(key, page.headers[header])
      }
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      for (let [key, val] of responseHeaders) {
        res.header(key, val)
      }
      res.header('Access-Control-Expose-Headers', [...responseHeaders.keys()].join(','))
      // must flush here -- otherwise pipe() will include the headers anyway!
      res.flushHeaders()
    })
    .pipe(res) // Stream requested url to response
}

/*
opts handler allows us to use our own CORS preflight settings
*/
function opts (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'))
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'))
    res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hrs if supported
    res.send(200)
}

module.exports = {get};

/*
var params = new URLSearchParams()
params.append('url', 'http://httpbin.org/cookies/set?k2=v2&k1=v1')
params.append('ignoreReqHeaders', '1')
// params.append('_method', 'get')

fetch('http://localhost:8080/?' + params, {})
.then(res => console.log(res))
*/




var e = request({
  // will be ignored
  method: 'GET',
  uri: 'http://httpbin.org/cookies/set?k2=v2&k1=v1',

  // HTTP Archive Request Object
  har: {
    url: 'http://httpbin.org/cookies/set?k2=v2&k1=v1',
    method: 'GET',
    headers: [
      {
        name: 'content-type',
        value: 'application/x-www-form-urlencoded'
      }
    ]
  }
}, function(a, e){
  console.log(e);
})
