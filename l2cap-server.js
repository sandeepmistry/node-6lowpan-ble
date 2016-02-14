var events = require('events');
var net = require('net');
var util = require('util');

var errno = require('errno').errno;
var ffi = require('ffi');
var ref = require('ref');

var L2CapHandle = require('./l2cap-handle');

var AF_BLUETOOTH = 31;
var SOCK_SEQPACKET = 5;
var BTPROTO_L2CAP = 0;
var BDADDR_LE_PUBLIC = 0x01;

var libc = ffi.Library(null, {
  'socket': [ 'int', [ 'int', 'int', 'int' ] ],
  'bind': [ 'int', [ 'int', 'pointer', 'int' ] ],
  'listen': [ 'int', [ 'int', 'int' ]],
  'accept': [ 'int', [ 'int', 'pointer', 'pointer' ] ],
});

function L2CapServer(options, connectionListener) {
  events.EventEmitter.call(this);

  this._socket = libc.socket(AF_BLUETOOTH, SOCK_SEQPACKET, BTPROTO_L2CAP);

  if (typeof(connectionListener) === 'function') {
    this.on('connect', connectionListener);
  }
}

util.inherits(L2CapServer, events.EventEmitter);

L2CapServer.prototype.listen = function(psm, backlog, callback) {
  var address = new Buffer(13).fill(0);

  address.writeUInt16LE(AF_BLUETOOTH, 0);
  address.writeUInt16LE(psm, 2);
  address.writeUInt8(BDADDR_LE_PUBLIC, 12);

  var bindResult = libc.bind(this._socket, address, address.length);

  if (bindResult === -1) {
    var no = ffi.errno();

    var err = new Error(errno[no].code + ': ' + errno[no].description + ', bind');

    this.emit('error', err);

    if (typeof(callback) === 'function') {
      callback(err);
    }

    return;
  }

  backlog = backlog || 511;

  var listenResult = libc.listen(this._socket, backlog);

  if (listenResult === -1) {
    var no = ffi.errno();

    var err = new Error(errno[no].code + ': ' + errno[no].description + ', bind');

    this.emit('error', err);

    if (typeof(callback) === 'function') {
      callback(err);
    }

    return;
  }

  process.nextTick(this._accept.bind(this));
};

L2CapServer.prototype._accept = function() {
  var address = new Buffer(14).fill(0);
  var addressSize = new Buffer(ref.sizeof.int);
  addressSize.type = ref.types.int;

  var result = libc.accept(this._socket, address, addressSize.ref());

  // libc.accept.async(this._socket, address, addressSize.ref(), function(err, result) {
    if (result > 0) {
      var socket = new net.Socket({
        handle: new L2CapHandle(result),
        readable: true,
        writable: true
      });

      this.emit('connection', socket);

      // process.nextTick(this._accept.bind(this));
    }
  // }.bind(this));
};

module.exports = L2CapServer;
