cors-adv-proxy
==============

A CORS proxy replacement. Based partly on http://crossorigin.me.

## What?
Making exactly the kind of request you want from a webpage can be tough...

That is why we unlike other cors proxies allows you to
 1. Use any http method you want
 2. Control exactly what headers are being sent n' received

## How?
With url params!

```js
var params = new URLSearchParams()
params.set('url', url)

// Useful if you want to extract the cookies that are being set durning a redirect
// (just the present of `noFollow` param will prevent redirects)
// http://httpbin.org/cookies/set?k2=v2&k1=v1
params.set('noFollow', 'true')

// If you are hot linking to something in a DOM tree you can only use GET method
// using method will Override the request method
// <iframe src="?method=post&url=http://httpbin.org/post"></iframe>
params.set('method', 'GET')

// By default request headers are being forwarded. If you don't want to send
// them along b/c you want to be anonymous (due to referrer automatically) being
// set unless configure the Referrer Policy. Origin also leaks information about
// where the request where made from when doing ajax calls
// (just the present of `ignoreReqHeaders` param will remove all headers)
params.set('ignoreReqHeaders', 'true')

// Another way of removing unwanted headers is by deleting them manually
params.set('deleteReqHeader', '["Referrer", "Origin"]')

// If you would like to override some unsafe headers that can't be set With
// xhr.setRequestHeaders (https://www.w3.org/TR/2014/WD-XMLHttpRequest-20140130/#dom-xmlhttprequest-setrequestheader)
// then you can use `setReqHeaders` param
// The value accept the same argument `Headers` constructor allows
// (2D array or key/val object)
//
// Here is the complete list of unsafe headers Ajax are not allowed to send:
// Accept-Charset, Accept-Encoding, Access-Control-Request-Headers,
// Access-Control-Request-Method, Connection, Content-Length, Cookie, Cookie2,
// Date, DNT, Expect, Host, Keep-Alive, Origin, Referer, TE, Trailer,
// Transfer-Encoding, Upgrade, User-Agent, Via
var h = new Headers([['Cookie', 'x=1']])
params.set('setReqHeaders', JSON.stringify([...h]))

// Using setReqHeaders will override headers much like `new Headers().set`
// If you just wish to add/append use addReqHeader
// (works the same way as `new Headers().add`)

// One alternative method to set unsafe headers without the params, Is prefixing
// all unsafe headers with `X-Cors-` all prefix will be removed before sending
fetch(url, {headers: {'X-Cors-Cookie': 'x=1'}})

// If you are not getting dose headers you wish for then you can add, delete, or
// set a value much like setReqHeaders, deleteReqHeader, and addReqHeader, only
// difference is you change the Req to Res
// Then you can get away with "refuse to execute script due to text/plain"
// or get away with 
```
