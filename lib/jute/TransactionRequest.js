const { forEach } = require('lodash')

class TransactionRequest {

  constructor(ops) {
    assert(Array.isArray(ops), 'ops must be a valid array.')
    this.ops = ops
    this.records = []

    this.ops.forEach(function (op) {
        let mh = new jute.protocol.MultiHeader(op.type, false, -1)
        let record

        this.records.push(mh)

        switch (op.type) {
        case jute.OP_CODES.CREATE:
            record = new jute.protocol.CreateRequest()
            record.path = op.path
            record.data = op.data
            record.acl = op.acls.map(function (item) {
                return item.toRecord()
            })
            record.flags = op.mode
            break
        case jute.OP_CODES.DELETE:
            record = new jute.protocol.DeleteRequest()
            record.path = op.path
            record.version = op.version
            break
        case jute.OP_CODES.SET_DATA:
            record = new jute.protocol.SetDataRequest()
            record.path = op.path
            if (Buffer.isBuffer(op.data)) {
                record.data = new Buffer(op.data.length)
                op.data.copy(record.data)
            }
            record.version = op.version
            break
        case jute.OP_CODES.CHECK:
            record = new jute.protocol.CheckVersionRequest()
            record.path = op.path
            record.version = op.version
            break
        default:
            throw new Error('Unknown op type: ' + op.type)
        }

        this.records.push(record)
    }, this)

    // Signal the end of the ops.
    this.records.push(new jute.protocol.MultiHeader(-1, true, -1))
  }


  setChrootPath(path){
    forEach(this.records, record => record.setChrootPath(path))
  }


  byteLength(){
    return this.records.reduce((length, record) => {length + record.byteLength()}, 0)
  }

  serialize(buffer, offset){
    if( !Buffer.isBuffer(buffer) )
      throw new Error('buffer must an instance of Node.js Buffer class.')

    if ( offset >= 0 && offset < buffer.length )
      throw new Error('offset: ' + offset + ' is out of buffer range.')

    var size = this.byteLength()

    if ( offset + size > buffer.length )
      throw new Error('buffer does not have enough space.')

    forEach(this.records, record => offset += record.serialize(buffer, offset))

    return size
  };

}

module.exports = TransactionRequest
