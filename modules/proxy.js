const request = require('request')
const URLSearchParams = require('url-search-params')
const Headers = require('fetch-headers')
const urlParser = require('url').parse
const Readable = require('stream').Readable

/*
  get handler handles standard GET reqs as well as streams
  order that it execute:

  1 Request
   1.0 Append all headers from the request (by stripping X-Cors-Req-)
       unless ignoreHeaders
   1.1 Set X-Forward-For ip adress
   1.2 Delete unwanted request headers
   1.3 add request headers from appendReqHeaders param
   1.4 set request headers from setReqHeaders param
   1.5 Override method if the `method` param exist
   1.6 Override body if the `body` param exist
   1.7 disable follow redirect if the `noFollow` param exist
   1.8 execute the request and pipe body to the request
 2 Response
  2.0 Append all headers from the response
      (by replaceing some unreadable headers with X-Cors-Res)
  2.1 Delete unwanted response headers
  2.2 add response headers from appendResHeaders param
  2.3 set response headers from setResHeaders param
  2.5 set Expose-Headers to all headers that should be exposed
  2.6 set Allow-Origin to *
*/
function get (req, res, next) {
  if(req.method.toLowerCase() === 'options') return opts(req, res)

  let {url} = req
  let search = url.substr(url.indexOf('?') + 1)
  let params = new URLSearchParams(search)
  let resHeaders = new Headers
  let reqHeaders = new Headers
  let method = params.get('method') || req.method // 1.5
  let body
  let followRedirect = !params.get('noFollow') // 1.7
  let deleteResHeaders = []
  let appendResHeaders = []
  let setResHeaders = []


  // Validate deleteResHeader
  if (params.has('deleteResHeaders')) {
    try {
      let deleteResHeaders = JSON.parse(params.get('deleteReqHeaders'))
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Expected deleteResHeader to be an array with strings')
    }
  }


  // Validate deleteResHeader
  if (params.has('appendResHeaders')) {
    try {
      appendResHeaders = new Headers(JSON.parse(params.get('appendResHeaders')))
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Failed to construct `new Headers` with appendResHeaders value')
    }
  }

  // Validate setResHeader
  if (params.has('setResHeaders')) {
    try {
      setResHeaders = new Headers(JSON.parse(params.get('setResHeaders')))
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Failed to construct `new Headers` with setResHeaders value')
    }
  }


  url = params.get('url')

  if (!url) {
    res.statusCode = 403
    res.header('Access-Control-Allow-Origin', '*')
    return res.end('url search param is required')
  }


  // 1.0
  if (!params.has('ignoreReqHeaders')) {
    for (let header in req.headers) {
      if(header.toLowerCase() !== 'host') {
        reqHeaders.append(header.replace(/^x-cors-req-/i,''), req.headers[header])
      }
    }
  }


  // 1.1
  let forwardedFor = reqHeaders.get('X-Fowarded-For')
  reqHeaders.set('X-Fowarded-For', (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress)

  // 1.2
  if (params.has('deleteReqHeaders')) {
    try {
      let keys = JSON.parse(params.get('deleteReqHeaders'))
      for (let key of keys) {
        reqHeaders.delete(key)
      }
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Expected deleteReqHeader to be an array with strings')
    }
  }


  // 1.3
  if (params.has('appendReqHeaders')) {
    try {
      let h = new Headers(JSON.parse(params.get('appendReqHeaders')))
      for (let [key, val] of h) {
        reqHeaders.append(key, val)
      }
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Failed to construct `new Headers` with appendReqHeaders value')
    }
  }


  // 1.4
  if (params.has('setReqHeaders')) {
    try {
      let h = new Headers(JSON.parse(params.get('setReqHeaders')))
      for (let [key, val] of h) {
        reqHeaders.set(key, val)
      }
    } catch (e) {
      res.statusCode = 403
      res.header('Access-Control-Allow-Origin', '*')
      return res.end('Failed to construct `new Headers` with setReqHeaders value')
    }
  }


  // 1.6
  if (params.has('body')) {
    body = Buffer.from(params.get('body'))
  } else {
    body = req
  }


  // convert Headers to a object to make request able to handle them
  let headers = Object.create(null)
  for (let [k,v] of reqHeaders) {
    headers[k] = v
  }

  req.headers = headers

  // 1.8
  var opts = {url, headers, method, followRedirect, body}
  var isRedirect = code => [301,302,303,307,308].includes(~~code)

  request(opts) // GET the document that the user specified
    .on('error', err => {
      console.error(err)
      res.end('')
    })
    .on('response', page => {
      res.statusCode = page.statusCode


      // 2.0
      let responseHeaders = new Headers

      if (isRedirect(res.statusCode)) {
        responseHeaders.append('X-Cors-Status', res.statusCode)
        res.statusCode = 200
      }

      for (let header in page.headers) {
        if (header.toLowerCase() === 'location') key = 'X-Cors-location'
        else if (header.toLowerCase() === 'set-cookie') key = 'X-Cors-' + header
        else key = header

        responseHeaders.append(key, page.headers[header])
      }

      // TODO: maybe ignore response header

      // 2.1
      for (let key of deleteResHeaders) {
        responseHeaders.delete(key)
      }

      // 2.2
      for (let [key, val] of appendResHeaders) {
        responseHeaders.append(key, val)
      }

      // 2.3
      for (let [key, val] of setResHeaders) {
        responseHeaders.set(key, val)
      }

      /*
       * Override everything else and expose all headers
       */
      responseHeaders.set('Access-Control-Expose-Headers', [...responseHeaders.keys()].join(','))
      responseHeaders.set('Access-Control-Allow-Origin', '*')

      for (let [key, val] of responseHeaders) {
        res.header(key, val)
      }

      // must flush here -- otherwise pipe() will include the headers anyway!
      res.flushHeaders()
    }).pipe(res)
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

module.exports = {get}
