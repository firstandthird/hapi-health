const Boom = require('@hapi/boom');
const str2fn = require('str2fn');
const path = require('path');
const package = require(path.join(process.cwd(), 'package.json'));

const defaults = {
  auth: false,
  token: false,
  endpoint: '/health',
  checks: [],
  envs: [] // list of environment variables to include in report
};

const register = function(server, options) {
  const settings = Object.assign({}, defaults, options);

  const handler = async (request, h) => {

    if (settings.token && settings.token !== request.query.token) {
      throw Boom.unauthorized();
    }

    const output = {
      host: server.info.host,
      env: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      version: package.version
    };
    if (settings.envs.length) {
      output.envs = settings.envs.reduce((memo, varName) => {
        memo[varName] = process.env[varName];
        return memo;
      }, {});
    }
    await Promise.all(settings.checks.map(async check => {
      if (!check.name || !check.method) {
        throw new Boom('Invalid check');
      }
      output[check.name] = await str2fn(
        check.method,
        server.methods,
        {
          request,
          options: check.options
        }
      );
    }));
    return output;
  };

  const routeConfig = {
    method: 'get',
    path: settings.endpoint,
    handler
  };
  // if auth is undefined set it to false to avoid the default auth:
  if (options.auth === undefined || options.auth === null) {
    options.auth = false;
  }
  if (options.auth || options.auth === false) {
    routeConfig.config = {
      auth: options.auth
    };
  }
  server.route(routeConfig);
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
