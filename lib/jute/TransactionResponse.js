const debug = require('debug')('dply:zk-client:jute:TransactionResponse')
const { isBuffer } = require('lodash')
const { JuteError } = require('./errors')
const protocol = require('./Protocol')
const OpCodes = require('./OpCodes')


class TransactionResponse {

  constructor(){
    this.results = []
    this.chrootPath = undefined
  }

  setChrootPath (path) {
    this.chrootPath = path
  }

  opDelete(){}

  opCreate(){}

  opSetData(){}

  opCheck(){}

  deserialize (buffer, offset) {
    if ( !isBuffer(buffer) )
      throw new ZkError('Paramater buffer must an instance of `Buffer`')

    if ( offset < 0 || offset > buffer.length )
      throw new ZkError(`Paramater offset "${offset}" is out of buffer range.`)

    let bytesRead = 0

    while (true) {
      let header = new protocol.MultiHeader()
      let response = null
      bytesRead += header.deserialize(buffer, offset + bytesRead)

      if (header.done.value) {
        debug('header is done')
        break
      }

      debug('got transaction response %s', header.type)
      switch (header.type.value) {

        case OpCodes.CREATE:
          response = new protocol.CreateResponse()
          response.setChrootPath(this.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          this.results.push({
            type: header.type.value,
            type_str: 'CREATE',
            path: response.path
          })
          break
      
        case OpCodes.DELETE:
          this.results.push({
            type: header.type.value,
            type_str: 'DELETE'
          })
          break
      
        case OpCodes.SET_DATA:
          response = new protocol.SetDataResponse()
          response.setChrootPath(this.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          this.results.push({
            type: header.type.value,
            type_str: 'SET_DATA',
            stat: response.stat.toJS()
          })
          break
      
        case OpCodes.CHECK:
          this.results.push({
            type: header.type.value,
            type_str: 'CHECK'
          })
          break
      
        case OpCodes.ERROR:
          response = new protocol.ErrorResponse()
          response.setChrootPath(self.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          this.results.push({
            type: header.type.value,
            type_str: 'ERROR',
            err: response.err
          })
          break

        default:
          throw new JuteError(`Unknown type: ${header.type} in transaction response.`)
      }
    }

    return bytesRead
  }
}


module.exports = {TransactionResponse}
