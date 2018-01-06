const hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const code = require('code');
const wreck = require('wreck');
const hapiHealthcheck = require('../index.js');
let server;

lab.beforeEach(() => {
  server = new hapi.Server({ port: 8000 });
});

lab.afterEach(async () => {
  await server.stop();
});

lab.test('default options', async() => {
  await server.register(hapiHealthcheck);
  await server.start();

  const result = await wreck.get('http://localhost:8000/health', { json: 'force' });

  code.expect(result.payload).to.be.an.object();
  code.expect(result.payload.host).to.equal(server.info.host);
  code.expect(result.payload.env).to.equal(process.env.NODE_ENV);
  code.expect(result.payload.uptime).to.exist();
  code.expect(result.payload.cpu).to.be.an.object();
  code.expect(result.payload.memory).to.be.an.object();
});

lab.test('token enabled but not passed', async() => {
  await server.register({
    plugin: hapiHealthcheck,
    options: {
      token: '1234'
    }
  });
  await server.start();

  try {
    await wreck.get('http://localhost:8000/health', { json: 'force' });
  } catch (e) {
    code.expect(e.output.statusCode).to.equal(401);
  }
});

lab.test('token passed', async() => {
  await server.register({
    plugin: hapiHealthcheck,
    options: {
      token: '1234'
    }
  });
  await server.start();

  const result = await wreck.get('http://localhost:8000/health?token=1234', { json: 'force' });

  code.expect(result.payload).to.be.an.object();
  code.expect(result.payload.host).to.equal(server.info.host);
  code.expect(result.payload.env).to.equal(process.env.NODE_ENV);
  code.expect(result.payload.uptime).to.exist();
  code.expect(result.payload.cpu).to.be.an.object();
  code.expect(result.payload.memory).to.be.an.object();
});


lab.test('custom checks', async() => {
  server.method('get.test', () => ({
    test: 1
  }));

  server.method('get.test2', (request, options) => ({
    test: options.testNumber
  }));

  await server.register({
    plugin: hapiHealthcheck,
    options: {
      checks: [
        {
          name: 'test1',
          method: 'get.test'
        },
        {
          name: 'test2',
          method: 'get.test2(request, options)',
          options: {
            testNumber: 2
          }
        }
      ]
    }
  });
  await server.start();

  const result = await wreck.get('http://localhost:8000/health', { json: 'force' });

  code.expect(result.payload).to.be.an.object();
  code.expect(result.payload.host).to.equal(server.info.host);
  code.expect(result.payload.env).to.equal(process.env.NODE_ENV);
  code.expect(result.payload.uptime).to.exist();
  code.expect(result.payload.cpu).to.be.an.object();
  code.expect(result.payload.memory).to.be.an.object();
  code.expect(result.payload.test1).to.be.an.object();
  code.expect(result.payload.test1.test).to.equal(1);
  code.expect(result.payload.test2).to.be.an.object();
  code.expect(result.payload.test2.test).to.equal(2);
});

lab.test('check missing name', async() => {
  server.method('get.test', () => ({
    test: 1
  }));

  await server.register({
    plugin: hapiHealthcheck,
    options: {
      checks: [
        {
          method: 'get.test'
        }
      ]
    }
  });
  await server.start();

  try {
    await wreck.get('http://localhost:8000/health', { json: 'force' });
    code.fail('something wrong');
  } catch (e) {
    code.expect(e).to.exist();
  }
});

lab.test('check missing method', async() => {
  server.method('get.test', () => ({
    test: 1
  }));

  await server.register({
    plugin: hapiHealthcheck,
    options: {
      checks: [
        {
          name: 'test'
        }
      ]
    }
  });
  await server.start();

  try {
    await wreck.get('http://localhost:8000/health', { json: 'force' });
    code.fail('something wrong');
  } catch (e) {
    code.expect(e).to.exist();
  }
});
