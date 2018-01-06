# hapi-healthcheck
server monitoring


### Options:
  - `token` - Optional token to secure the endpoint.
  - `endpoint` - Route to use. Defaults to `/health`
  - `checks` - array objects for each check.
    - `name` - Name of the check, used as the key in the response json.
    - `method` - server method to call. Will be called as `async method(request, options)`. Function should return json.
    - `options` - optional data to pass to the method.

### Example output:

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
  "customCheck": { "test": 1 }
}
```
