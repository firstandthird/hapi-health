# hapi-health

  [hapi](https://hapi.dev/) plugin that exposes a '/health' route that can be
  used for checking basic health metrics for your server.

## Installation

```
npm install hapi-health
```

## Basic Usage
```js
await server.register({
  plugin: require('hapi-health')
});
```

Then GET _/health_ you will get back something like:
```json
{
  "host": "sorrynotsorry.local",
  "env": "test",
  "uptime": 0,
  "cpu": { "user": 384085, "system": 48978 },
  "memory": {
    "rss": 47497216,
    "heapTotal": 32874496,
    "heapUsed": 18066608,
    "external": 518509
  }
}
```

## Custom Checks

  You can also use hapi [server methods](https://hapi.dev/api/?v=20.1.0#-servermethodname-method-options) to run and return custom checks that will then be returned along with the other metrics. These server methods must accept the parameter signature _(request, options)_, where _request_ will be the hapi [request object](https://hapi.dev/api/?v=20.1.0#request) and _options_ is an object that you specify when you register the plugin.  The server must return a JSON object, but they can be either sync or async.

  Pass _checks_ as an array, each item in the array should have the following fields:

  - _name_ (required)

    Name of the check, hapi-health will add a field with this name containined the output of the server.method.
  - _method_ (required)

    Name of the server method to call (nested server methods can be called like 'foo.bar.bat').
  - _options_ (optional)

    You can specify an _options_ object that will be passed to the server method when it is invoked.

For example:

```js
server.method('foo', async(request, options) => {
  return {
    user: request.auth.credentials.user,
    result: options.arg1 + 1
  };
});

await server.register({
  plugin: require('hapi-health'),
  options: {
    checks: [
      {
        name: 'My Custom Check',
        method 'foo',
        options: {
          arg1: 2
        }},
    ]
  }
});
```

Now when you call _/health_ you will get something like:

```json
{
  "host": "sorrynotsorry.local",
  "env": "test",
  "uptime": 0,
  "cpu": { "user": 384085, "system": 48978 },
  "memory": {
    "rss": 47497216,
    "heapTotal": 32874496,
    "heapUsed": 18066608,
    "external": 518509
  },
  "My Custom Check": {
    "user": "myself",
    "result": 3
  }
}
```


## Other Options:

- _auth_

  By default the _/health_ route is unprotected, but you can specify a standard hapi [auth route config](https://hapi.dev/api/?v=20.1.0#-routeoptionsauth), which will be applied to the route config.

- _token_

  When specified, hapi-health will also internally require a '?token=<token>' parameter when calling the _/health_ route.  If it does not match or is not present then it will return a 401 Unauthorized.  This is in addition to any _auth_ config that has been applied to the route.

- _endpoint_

  By default hapi-health uses _/health_ as the endpoint, but you can use this option to specify a different route to use as your health endpoint.
