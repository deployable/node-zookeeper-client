const debug = require('debug')('dply:node-zookeer-client:jute:Serialize')
const trace = require('debug')('dply:node-zookeer-client:trace:jute:Serialize')

const { JuteError, JuteTypeError } = require('./errors')
const { forEach, isString} = require('lodash')


class Serialize {

  static int ( value, buffer, offset ){ 
    buffer.writeInt32BE(value, offset)
    return 4
  }


  static long  ( value, buffer, offset ){ 
    // Long is represented by a buffer of 8 bytes in big endian since
    // Javascript does not support native 64 integer.
    if ( ! Buffer.isBuffer(value) )
      throw new JuteError(`long wasn't a buffer? ${value}`)

    value.copy(buffer, offset)
    return 8
  }


  static buffer ( value, buffer, offset ){ 
    if ( ! Buffer.isBuffer(value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(value.length, offset)
    let bytesWritten = 4

    value.copy(buffer, offset + bytesWritten)
    bytesWritten += value.length

    return bytesWritten
  }


  static ustring  ( value, buffer, offset ){ 
    if (typeof value !== 'string') {
      buffer.writeInt32BE(-1, offset)
      return 4
    }
    
    let length = Buffer.byteLength(value)
    buffer.writeInt32BE(length, offset)
    let bytesWritten = 4

    new Buffer(value).copy(buffer, offset + bytesWritten)
    bytesWritten += length

    return bytesWritten
  }


  static boolean ( value, buffer, offset ){
    buffer.writeUInt8(Boolean(value), offset)
    return 1
  }
 

  static vector ( vector_type, value, buffer, offset){
    // vector size + vector content
    if (! Array.isArray(value)) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(value.length, offset)
    let bytesWritten = 4

    forEach(value, item => {
      bytesWritten += this.byType(
        vector_type,
        item,
        buffer,
        offset + bytesWritten
      )
    })
    return bytesWritten
  }


  static data ( value, buffer, offset ){
    return value.serialize(value, buffer, offset)
  }


  static default ( type, value, buffer, offset ) {
    
    if ( ! isString(type) )
      throw new JuteError(`Paramater type must be a string: "${typeof type}"`)

    let match
    if ( match = type.match(/^vector<([\w.]+)>/) )
      return Serialize.vector( match[1], value, buffer, offset)

    if ( type.match(/^data\.\w+/) )
      return this.data( value, buffer, offset)
    
    throw new JuteTypeError(`Unknown type "${type}"`, { type: type })
  }


  static byType ( type, value, buffer, offset ){
    debug('serialize by type %s', type, value, buffer, offset)
    if ( this[type] ) return this[type]( value, buffer, offset)
    return this.default(type, value, buffer, offset)
  }

}

module.exports = { Serialize } 
