process.env.HCI_CHANNEL_USER = 1;

var bleno = require('bleno');
var sixlo = require('6lowpan');

var IPSP_UUID = '1820';
var LE_SIGNALING_CID = 0x0005;
var IPSP_PSM = 0x0023;

var LE_CONN_REQ = 0x14;
var LE_CONN_RSP = 0x15;

var handleInfo = {};

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising(null, [IPSP_UUID]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno._bindings._hci.on('aclDataPkt', function(handle, cid, data) {
  console.log(handle, cid, data.toString('hex'));

  if (cid === LE_SIGNALING_CID) {
    if (data.readUInt8(0) === LE_CONN_REQ &&
        data.readUInt8(1) === 0x01 && // ???
        data.readUInt16LE(2) === 0x0a && // length
        data.readUInt16LE(4) === IPSP_PSM // psm
      ) {

      var scid = data.readUInt16LE(6);
      var mtu = data.readUInt16LE(8);
      var mps = data.readUInt16LE(10);
      var credits = data.readUInt16LE(12);

      var response = new Buffer(14);

      response.writeUInt8(LE_CONN_RSP, 0);
      response.writeUInt8(0x01, 1); // ???
      response.writeUInt16LE(10, 2); // length
      response.writeUInt16LE(handle, 4); // dcid
      response.writeUInt16LE(mtu, 6); // mtu
      response.writeUInt16LE(mps, 8); // mps
      response.writeUInt16LE(credits, 10); // credits
      response.writeUInt16LE(0x0000, 12); // result

      handleInfo[handle] = {
        scid: scid,
        mtu: mtu,
        mps: mps,
        credits: credits
      };

      bleno._bindings._hci.writeAclDataPkt(handle, cid, response);
    }
  } else if (cid === handle) {
    var length = data.readUInt16LE(0);
    var packet = data.slice(2);

    sixlo.parse(packet, function(data, error) {
      console.log(data);
    });
  }
});
