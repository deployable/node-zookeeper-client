/**
 * This class represent the request the client sends over the wire to ZooKeeper
 * server.
 *
 * @class Request
 * @constructor
 * @param header {Record} The request header record.
 * @param payload {payload} The request payload record.
 */

const debug = require('debug')('dply:zk-client:jute:Request')


module.exports = class Request {

  constructor(header, payload) {
    this.header = header
    this.payload = payload
  }

  /**
   * Serialize the request to a buffer.
   * @method toBuffer
   * @return {Buffer} The buffer which contains the serialized request.
   */
  toBuffer () {
    let size = 0
    let offset = 0

    if (this.header) size += this.header.byteLength()
    if (this.payload) size += this.payload.byteLength()

    // Needs 4 extra for the length field (Int32)
    let buffer = new Buffer(size + 4)

    buffer.writeInt32BE(size, offset)
    offset += 4

    if (this.header) offset += this.header.serialize(buffer, offset)
    if (this.payload) offset += this.payload.serialize(buffer, offset)

    debug('toBuffer() size:%s-8 header:%s %s rest:', 
      buffer.readInt32BE(0,4), 
      buffer.readInt32BE(4,4), 
      buffer.readInt32BE(8,4),
      buffer.slice(12)
    )
    return buffer
  }

  splitBuffer(buffer){
    let length = buffer.readUInt32(0,4)
    let header = buffer.readUInt32(4,4)
    let type = buffer.readUInt32(4,8)
  }

}