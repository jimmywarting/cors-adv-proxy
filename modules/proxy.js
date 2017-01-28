const request = require('request')
const fetch = require('node-fetch')
const URL = require('url')


  request({
    method: 'GET',
    url: 'http://httpbin.org/post',

    har: {
      url: 'http://httpbin.org/post',
      method: 'POST',
      headers: [
        {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded'
        }
      ],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'foo',
            value: 'bar'
          },
          {
            name: 'hello',
            value: 'world'
          }
        ]
      }
    }
  })
  .on('response', page => {
    console.log(page.statusCode)
    //
    // for (let header in page.headers)
    //   res.header(header, page.headers[header])
    //
    // res.header('Access-Control-Expose-Headers', Object.keys(page.headers).join(', '))
    // res.header('Access-Control-Expose-Headers', Object.keys(page.headers).join(', '))
  })
  .on('data', d => console.log(d+''))



/*
get handler handles standard GET reqs as well as streams
*/
function get (req, res, next) {
  // let query = new URLSearchParams(req.url)
  let {
    addReqHeaders,
    addResHeaders,
    setResHeaders,
    deleteResHeaders,
    method = req.method,
    body,
    url
  } = req.query

  // res.header('Access-Control-Allow-Origin', req.headers.origin)

  request({
    har: {
      url: 'http://www.mockbin.com/har',
      method: 'POST',
      headers: [
        {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded'
        }
      ],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'foo',
            value: 'bar'
          },
          {
            name: 'hello',
            value: 'world'
          }
        ]
      }
    }
  })
  .on('response', page => {
    res.statusCode = page.statusCode;

    for (let header in page.headers)
      res.header(header, page.headers[header])

    res.header('Access-Control-Expose-Headers', Object.keys(page.headers).join(', '))
    res.header('Access-Control-Expose-Headers', Object.keys(page.headers).join(', '))
    res.flushHeaders()

    response.on('data', data => {
      console.log('received ' + data)
    })
  })
}

/*
opts handler allows us to use our own CORS preflight settings
*/
function opts (req, res, next) { // Couple of lines taken from http://stackoverflow.com/questions/14338683
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET') // Only allow GET for now
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hrs if supported
    res.send(200)
    next()
}

module.exports = {get, opts}

/*
var params = new URLSearchParams
params.append('url', url)

// additional headers to include in the request
// Normaly you can use headers but simple href can't add them and ajax blacklist
// cookies, origin & Referer
params.set('addReqHeaders', JSON.stringify(Object|Array))

// additional headers to include in the response
// eg: add content-disposition header to save a file...
params.set('addResHeaders', JSON.stringify(Object|Array))

// overides response headers (can be used to overide content-type text/plain to text/javascript)
params.set('setResHeaders', JSON.stringify(Object|Array))

// delete response headers
params.set('deleteResHeaders', 'text/javascript')

// Overide http method (can be used to convert a post request to a get if you want to show a link instead)
params.set('method', 'post')

// will only be used if the above method is not undefined|GET|HEAD
params.set('body', 'foo')


fetch(proxy + '?' + params, {

})
*/
