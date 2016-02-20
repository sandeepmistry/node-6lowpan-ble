var bleno = require('bleno');
var sixlo = require('6lowpan');

var l2cap = require('./l2cap');

var IPSP_UUID = '1820';
var L2CAP_PSM_IPSP = 0x0023;

var server = l2cap.createServer();

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising(null, [IPSP_UUID]);

    server.listen(L2CAP_PSM_IPSP, function(err) {
      console.log('server -> listen');
    });
  } else {
    bleno.stopAdvertising();
  }
});

server.on('connection', function(socket) {
  console.log('server on -> connection');

  socket.on('data', function(data) {
    console.log('socket on -> data');

    sixlo.parse(data, function(data, error) {
      console.log(data);
    });
  });
});

process.on('SIGINT', function() {
  server.close();
  console.log('SIGINT');
  process.exit();
});
