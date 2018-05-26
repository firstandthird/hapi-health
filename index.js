const async = require('async');
const Boom = require('boom');
const str2fn = require('str2fn');
const package = require('./package.json');

const defaults = {
  auth: false,
  token: false,
  endpoint: '/health',
  checks: []
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

    await async.each(settings.checks, async check => {
      if (!check.name || !check.method) {
        throw new Boom('Invalid check');
      }

      output[check.name] = await str2fn.execute(
        check.method,
        server.methods,
        {
          request,
          options: check.options
        }
      );
    });

    return output;
  };

  const routeConfig = {
    method: 'get',
    path: settings.endpoint,
    handler
  };
  if (options.auth) {
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
