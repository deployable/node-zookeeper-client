const { JuteError } = require('./errors')
const { JuteData } = require('./Data')


class Deserialize {

  static int(buffer, offset){
    return {
      value: buffer.readInt32BE(offset),
      bytesRead: 4
    }
  }

  static long(buffer, offset){
    // Long is represented by a buffer of 8 bytes in big endian since
    // Javascript does not support native 64 integer.
    let value = new Buffer(8)
    buffer.copy(value, 0, offset, offset + 8)
    return {
      value: value,
      bytesRead: 8
    }
  }

  static buffer(buffer, offset){
    let length = buffer.readInt32BE(offset)
    let bytesRead = 4

    if ( length === -1 )
      return { value: undefined, bytesRead: 4 }

    let value = new Buffer(length)
    buffer.copy(
      value,
      0,
      offset + bytesRead,
      offset + bytesRead + length
    )

    bytesRead += length

    return {
      value: value,
      bytesRead: bytesRead
    }
  }

  static ustring(buffer, offset){
    let length = buffer.readInt32BE(offset)
    let bytesRead = 4

    if (length === -1) return { value: undefined, bytesRead: 4 }
      
    let value = buffer.toString(
      'utf8',
      offset + bytesRead,
      offset + bytesRead + length
    )

    return {
      value: value,
      bytesRead: bytesRead
    }
  }

  static boolean(buffer, offset){
    return {
      value: Boolean(buffer.readUInt8(offset)),
      bytesRead: 1
    }
  }

  static vectorType ( type ){
    let match = type.match(/^vector<([\w\.]+)>$/)
    return ( match === null ) ? null : match[1]
  }

  static vector(vector_type, buffer, offset){
    let length = buffer.readInt32BE(offset)
    let bytesRead = 4

    if (length === -1) return { value: undefined, bytesRead: 4 }

    let value = []

    while (length > 0) {
      let result = this.byType(vector_type, buffer, offset + bytesRead)
      value.push(result.value)
      bytesRead += result.bytesRead
      length -= 1
    }
    
    return { value: value, bytesRead: bytesRead }
  }

  static dataType (type) {
    let match = type.match(/^data\.(\w+)$/)
    return ( match === null ) ? null : match[1]
  }

  static data(data_type, buffer, offset){
    // lazy load the dep to avoid circular deps
    let value = JuteData.create(data_type)
    let bytesRead = value.deserialize(buffer, offset)

    return { value: value, bytesRead: bytesRead }
  }

  static byType( type, buffer, offset ){
    if ( this[type] ) return this[type](buffer, offset)
    if (type.startsWith('vector<')) return this.vector(type, buffer, offset)
    if (type.startsWith('data.')) return this.data(type, buffer, offset)
    throw new JuteError(`Unknown jute proto type: ${type}`, {type: type})
  }

}

module.exports = { Deserialize } 
