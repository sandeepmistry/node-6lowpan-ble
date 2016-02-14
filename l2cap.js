var L2CapServer = require('./l2cap-server');

function createServer(options, connectionListener) {
  return new L2CapServer(options, connectionListener);
};

module.exports = {
  createServer: createServer
};
