// # Jute Types

// https://github.com/apache/zookeeper/tree/master/src/java/main/org/apache/jute/compiler

// Would be good to move into the code zookeeper jute generator

const debug = require('debug')('dply:zk-client:jute:Types')

const { isNumber,
      isBuffer,
      isString,
      isArray,
      forEach } = require('lodash')

const { JuteError } = require('./errors')

const MAX_UINT32 = 0xFFFFFFFF


class JuteType {

  static create(value){
    if (value instanceof this) return value
    return new this(value)
  }

  static createDeserialize(buffer, offset){
    let jt = new this()
    jt.deserialize(buffer, offset)
    return jt
  }

  get value(){
    return this._value
  }

  toJs(){
    let o = {}
    o = this.value
    return o
  }

  serialize(buffer, offset){
    throw new JuteError('Not implemented', buffer, offset)
  }
  deserialize(buffer, offset){
    throw new JuteError('Not implemented', buffer, offset)
  }

}

// ## JuteTypeInt

class JuteTypeInt extends JuteType {

  constructor(value){
    super(value)
    this.bytes = 4
    this.value = value
    this.base_size = 4
  }
  get value(){
    return this._value
  }
  set value(val){
    debug('set int', val)
    this._value = isNumber(val) ? val : 0
  }

  toString(){
    return this.value.toString()
  }

  toJS(){
    return this.value
  }

  serialize(buffer, offset){
    debug('serialize int', this.value)
    buffer.writeInt32BE(this.value, offset)
    return this.bytes
  }
  deserialize(buffer, offset){
    this.value = buffer.readInt32BE(offset)
    debug('deserialize int', this.value)
    return this.value
  }
  
}


// ## JuteTypeLong

class JuteTypeLong extends JuteType {

  constructor(value){
    super(value)
    this.bytes = 8
    this.value = value
    this.base_size = 8
  }

  get value(){
    return this._value
  }
  set value (val){
    debug('set long', val)
    let buf = new Buffer(8)
    buf.fill(0)
    if ( isBuffer(val) ){
      val.copy(buf)
      debug('long copied buf', val)
    }
    else if ( isNumber(val) ){
      buf = this.intToBuf(val)
      debug('long copied num', val)
    }
    this.low = buf.readUInt32BE(4)
    this.high = buf.readUInt32BE(0)
    debug('long value is ', buf, this.high, this.low)
    return this._value = buf
  }

  intToBuf(val){
    let buf = new Buffer(8)
    buf.fill(0)
    const big64 = ~~(val / MAX_UINT32)
    //const low64 = (val % MAX_UINT32) - big64
    const low64 = val & MAX_UINT32
    buf.writeUInt32BE(big64, 0)
    buf.writeUInt32BE(low64, 4)
    return buf
  }

  isEqualToOrGreaterThan(previous){
    
    // Greater high
    if (this.high >= previous.high )
      return true

    // Greater low
    if (this.high === previous.high && this.low >= previous.low)
      return true

    // Otherwise, equal or less than
    return false
  }

  isGreaterThan(previous){
    
    // Greater high
    if (this.high > previous.high )
      return true

    // Greater low
    if (this.high === previous.high && this.low > previous.low)
      return true

    // Otherwise, equal or less than
    return false
  }

  toString(){
    return this.value.toString()
  }

  toJS(){
    let o = this.value.toJSON()
    o.type = 'Long'
    return o
  }

  serialize(buffer, offset){
    debug('serialize long', this.value, offset)
    this._value.copy(buffer, offset)
    return this.bytes
  }

  deserialize(buffer, offset){
    buffer.copy(this._value, 0, offset, offset + 8)
    debug('deserialize long', this._value, offset)
    this.low = this._value.readUInt32BE(4)
    this.high = this._value.readUInt32BE(0)
    return this.value
  }
}


// ## JuteTypeBoolean

class JuteTypeBoolean extends JuteType {

  constructor(value){
    super(value)
    this.bytes = 1
    this.value = value
    this.base_size = 1
  }

  get value(){
    return this._value
  }
  set value(val){
    debug('set boolean', val)
    this._value = Boolean(val)
  }

  toString(){
    return this.value.toString()
  }

  serialize(buffer, offset){
    debug('serialize boolean', this.value, offset)
    buffer.writeUInt8(Boolean(this.value), offset)
    return this.bytes
  }

  deserialize(buffer, offset){
    this.value = Boolean(buffer.readUInt8(offset))
    debug('deserialize boolean', this.value, offset)
    return this.value
  }
}


// ## JuteTypeBuffer

class JuteTypeBuffer extends JuteType {

  constructor(value){
    super(value)
    this.value = value
    this.base_size = 4
  }

  get value(){
    return this._value
  }

  // This will copy a buffers data into a new buffer
  set value(val){
    debug('set buffer', val)
    if ( ! isBuffer(val) ) return this._value = undefined
    this._value = new Buffer(val.length)
    val.copy(this._value)
  }

  get bytes(){
    if ( this.value === undefined ) return 4
    return 4 + this.value.length
  }

  toString(){
    return this.value.toString()
  }

  copyFromBuffer(buffer){
    buffer.copy()
  }

  serialize(buffer, offset){
    debug('serialize buffer', this.value, offset)
    if ( ! Buffer.isBuffer(this.value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(this.value.length, offset)
    let bytesWritten = 4

    this.value.copy(buffer, offset + bytesWritten)
    bytesWritten += this.value.length
    return bytesWritten
  }

  deserialize(buffer, offset){
    debug('deserialize buffer', buffer, offset)
    let length = buffer.readInt32BE(offset)
    let bytesRead = 4

    if ( length === -1 ) return this.value = undefined

    let value = new Buffer(length)
    buffer.copy(
      value,
      0,
      offset + bytesRead,
      offset + bytesRead + length
    )
    debug('deserialized buffer to', value)
    return this._value = value
  }
}



// ## JuteTypeString

class JuteTypeString extends JuteType {

  constructor(value){
    super(value)
    this.value = value
    this.base_size = 4
  }
  get value(){
    return this._value
  }

  set value(val){
    debug('set string', val)
    if ( isString(val) ) {
      this.length = Buffer.byteLength(val)
      return this._value = val
    }
    this.length = -1
    this._value = undefined
  }

  get bytes(){
    if ( isString(this.value) ) return 4 + this.length
    return 4
  }

  toString(){
    return `${this.value}`
  }

  serialize(buffer, offset){
    debug('serialize string', this.value, offset)
    if ( ! isString(this.value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }
    
    buffer.writeInt32BE(this.length, offset)
    let bytesWritten = 4

    new Buffer(this.value).copy(buffer, offset + bytesWritten)
    bytesWritten += this.length

    return bytesWritten
  }  

  deserialize(buffer, offset){
    let length = buffer.readInt32BE(offset)
    if (length === -1) return this.value = undefined
      
    this.value = buffer.toString(
      'utf8',
      offset + 4,
      offset + 4 + length
    )

    debug('deserialized string', this.value, offset)
    return this.value
  }
}



// ## JuteTypeVector

class JuteTypeVector extends JuteType {
  
  static create(sub_type, values){ 
    if (values instanceof JuteTypeVector) return values
    return new JuteTypeVector(sub_type, values)
  }
  
  static createDeserialize(sub_type, buffer, offset){
    let jvect = new JuteTypeVector(sub_type)
    jvect.deserialize(buffer, offset)
    return jvect
  }

  constructor(sub_type, values){
    super(sub_type, values)
    debug('sub_type', sub_type.name)
    this.sub_type = sub_type
    this.value = values || []
  }
  
  get value(){
    return this._value
  }
  
  set value(val){
    debug('set vector', val)
    let length = 0
    if ( ! isArray(val) ) {
      this._value = undefined
      this.length = -1
      return
    }
    this._value = val.map(v => {
      if ( v instanceof this.sub_type ) {
        length += v.bytes
        return v
      }
      const entry = this.sub_type.create(v)
      length += entry.bytes
      return entry
    })
    this.length = length
  }
  
  get bytes(){
    if ( ! isArray(this.value) ) return 4
    return 4 + this.value.reduce((sum, v)=> { return sum += v.bytes }, 0)
  }
  
  toString(){
    return `vector<${this.sub_type}>`
  }
  
  serialize(buffer, offset){
    debug('serialize vector', this.value, offset)
    let val = this.value
    // vector size + vector content
    if ( ! isArray(val) || val.length === 0 ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    // Writes the number of items in the vector
    buffer.writeInt32BE(val.length, offset)
    let bytesWritten = 4

    // Then each of the items in the vevtor
    forEach(val, item => {
      bytesWritten += item.serialize(buffer, offset+bytesWritten)
    })
    return bytesWritten
  }

  deserialize(buffer, offset){
    let length = buffer.readInt32BE(offset)
    let bytesRead = 4

    if (length === -1) return this.value = undefined

    this.value = []

    while (length > 0) {
      let item = this.sub_type.create()
      item.deserialize(buffer, offset + bytesRead)
      this.value.push(item)
      bytesRead += item.bytes
      length -= 1
    }

    debug('deserialized string', this.value, offset)
    return this.value
  }
}



class JuteTypeLookup {
  static get(type){
    return this.types[type]
  }
  static create(type, ...args){
    debug(`creating type ${type}`)
    return new this.types[type](...args)
  }
}
JuteTypeLookup.types = {
  int: JuteTypeInt,
  long: JuteTypeLong,
  boolean: JuteTypeBoolean,
  buffer: JuteTypeBuffer,
  string: JuteTypeString,
  vector: JuteTypeVector
}


module.exports = { 
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeString,
  JuteTypeVector,
  JuteTypeLookup
}