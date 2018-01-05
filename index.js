const async = require('async');
const Boom = require('boom');
const str2fn = require('str2fn');

const defaults = {
  token: false,
  endpoint: '/health',
  checks: []
};

const register = function(server, options) {
  const settings = Object.assign({}, defaults, options);

  server.route({
    method: 'get',
    path: settings.endpoint,
    async handler(request, h) {
      if (settings.token && settings.token !== request.query.token) {
        throw Boom.unauthorized();
      }

      const output = {
        host: server.info.host,
        env: process.env.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        cpu: process.cpuUsage(),
        memory: process.memoryUsage()
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
    }
  });
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
