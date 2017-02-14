const debug = require('debug')('dply:zk-client:jute:TransactionRequest')
const { forEach, isBuffer } = require('lodash')

const protocol = require('./Protocol')
const { ZkError } = require('./errors')
const jute_op_codes = require('./OpCodes.js')


class TransactionRequest {

  constructor(ops) {
    if ( ! Array.isArray(ops) )
      throw new ZkError('ops must be a valid array.')

    this.ops = ops
    this.records = []

    this.ops.forEach(op => {
        let mh = new protocol.MultiHeader(op.type, false, -1)
        let record

        this.records.push(mh)

        switch (op.type) {
          case jute_op_codes.CREATE:
            record = new protocol.CreateRequest(op.path, op.data, undefined, op.mode)
            record.acl = op.acls.map(item => item.toRecord())
            break

          case jute_op_codes.DELETE:
            record = new protocol.DeleteRequest(op.path, op.version)
            break

          case jute_op_codes.SET_DATA:
            record = new protocol.SetDataRequest(op.path, op.data, op.version)
            break

          case jute_op_codes.CHECK:
            record = new protocol.CheckVersionRequest(op.path, op.version)
            break

          default:
            throw new ZkError(`Unknown transaction operation type: ${op.type}`)
        }

        this.records.push(record)
    })

    // Signal the end of the ops.
    this.records.push(new protocol.MultiHeader(-1, true, -1))
  }


  setChrootPath(path){
    forEach(this.records, record => record.setChrootPath(path))
  }


  byteLength(){
    let sum = 0
    sum = this.records.reduce((length, record) => {return length + record.byteLength()}, sum)
    debug('transaction byteLength is %s', sum)
    return sum
  }

  serialize(buffer, offset){
    if( !isBuffer(buffer) )
      throw new ZkError(`Transaction serialize buffer must an instance of Node.js Buffer class. ${typeof buffer}`)

    if ( offset < 0 || offset > buffer.length )
      throw new ZkError(`Transaction serialize offset: ${offset} is out of buffer range.`)

    let size = this.byteLength()

    if ( offset + size > buffer.length )
      throw new ZkError(`Buffer does not have enough space to serialize transaction. ${offset+size} > ${buffer.length}`)

    forEach(this.records, record => offset += record.serialize(buffer, offset))

    return size
  }

}

module.exports = { TransactionRequest, ZkError }
