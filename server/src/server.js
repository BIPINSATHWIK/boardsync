const http = require('http');
const app = require('./app');
const { connect } = require('./config/db');
const { PORT } = require('./config/env');
const { init: initSocket } = require('./sockets');

const server = http.createServer(app);

const start = async () => {
  await connect();
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();

module.exports = server;
