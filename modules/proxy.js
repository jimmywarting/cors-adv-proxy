const request = require('request')
const URLSearchParams = require('url-search-params')
const Headers = require('fetch-headers')

/*
  get handler handles standard GET reqs as well as streams
*/
function get (req, res, next) {
  let {url} = req
  let search = url.substr(url.indexOf('?') + 1)
  let params = new URLSearchParams(search)

  res.header('Access-Control-Allow-Origin', '*'); // Actually do the CORS thing! :)

  url = params.get('url')
  if (!url) {
    res.statusCode = 403;
    return res.end('url search param is required');
  }

  // forward client headers to server
  let headers = new Headers()
  for (let header in req.headers) {
    headers.append(header, req.headers[header])
  }

  let forwardedFor = headers.get('X-Fowarded-For')
  headers.set('X-Fowarded-For', (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress)

  request
    .get(url, {headers}) // GET the document that the user specified
    .on('response', page => {
      res.statusCode = page.statusCode;

      // include only desired headers
      for (let header in page.headers) {
        res.header(header, page.headers[header])
      }

      // must flush here -- otherwise pipe() will include the headers anyway!
      res.flushHeaders()
    })
    .pipe(res) // Stream requested url to response
}

/*
post and put handlers both handle sending data to servers
*/
function post (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // Actually do the CORS thing! :)
    next();
}

function put (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // Actually do the CORS thing! :)
    next();
}

/*
opts handler allows us to use our own CORS preflight settings
*/
function opts (req, res, next) { // Couple of lines taken from http://stackoverflow.com/questions/14338683
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hrs if supported
    res.send(200);
    next();
}

module.exports = {get, post, put, opts};
