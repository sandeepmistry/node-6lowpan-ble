var ffi = require('ffi');
var ref = require('ref');

var libc = ffi.Library(null, {
  'read': [ 'int', [ 'int', 'pointer', 'int' ] ]
});

function L2CapHandle(fd) {
  this._fd = fd;
  this.writeQueueSize = 0;
}

L2CapHandle.prototype.readStart = function() {
  var buffer = new Buffer(65535);

  var result = libc.read(this._fd, buffer, buffer.length);
  // libc.read.async(this._fd, buffer, buffer.length, function(err, result) {
    if (result !== -1) {
      this.onread(result, buffer.slice(0, result));

      process.nextTick(this.readStart.bind(this));
    }
  // }.bind(this));
};

L2CapHandle.prototype.close = function() {
  console.log('close');
};

L2CapHandle.prototype.shutdown = function() {
  console.log('shutdown');
};

// getpeername(out)
// getsockname(out)
// writev(req, chunks)

module.exports = L2CapHandle;
