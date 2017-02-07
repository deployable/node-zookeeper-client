// # Jute Types

// https://github.com/apache/zookeeper/tree/master/src/java/main/org/apache/jute/compiler

// Would be good to move into the code zookeeper jute generator

const debug = require('debug')('dply:zk-client:jute:Types')

const { isNumber,
      isBuffer,
      isString,
      isBoolean,
      isArray,
      forEach } = require('lodash')

const { JuteError } = require('./errors')

const MAX_UINT32 = 0xFFFFFFFF


// ## JuteTypeInt

class JuteTypeInt {
  static create(value){
    return new JuteTypeInt(value)
  }
  static createDeserialize(buffer, offset){
    let int = new JuteTypeInt()
    int.deserialize(buffer, offset)
    return int
  }
  constructor(value){
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

class JuteTypeLong {
  static create(value){
    return new JuteTypeLong(value)
  }
  static createDeserialize(buffer, offset){
    let long = new JuteTypeLong()
    long.deserialize(buffer, offset)
    return long
  }
  constructor(value){
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
      return this._value = buf
    }
    if ( isNumber(val) ){
      const big64 = ~~(val / MAX_UINT32)
      const low64 = (val % MAX_UINT32) - big64
      buf.writeUInt32BE(big64, 0)
      buf.writeUInt32BE(low64, 4)
      debug('long copied num', val, buf)
      return this._value = buf
    }
    debug('long value is ', buf)
    return this._value = buf
  }
  toString(){
    return this.value.toString()
  }
  serialize(buffer, offset){
    debug('serialize long', this.value, offset)
    this._value.copy(buffer, offset)
    return this.bytes
  }
  deserialize(buffer, offset){
    buffer.copy(this._value, 0, offset, offset + 8)
    debug('deserialize long', this._value, offset)
    return this.value
  }
}


// ## JuteTypeBoolean

class JuteTypeBoolean {
  static create(value){
    return new JuteTypeBoolean(value)
  }
  static createDeserialize(buffer, offset){
    let bool = new JuteTypeBoolean()
    bool.deserialize(buffer, offset)
    return bool
  }
  constructor(value){
    this.bytes = 1
    this.value = value
    this.base_size = 1
  }
  get value(){
    return this._value
  }
  set value(val){
    debug('set boolean', val)
    if ( isBoolean(val) ) return this._value = val
    this._value = false
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

class JuteTypeBuffer {

  static create(value){
    return new JuteTypeBuffer(value)
  }
  static createDeserialize(buffer, offset){
    let jbuf = new JuteTypeBoolean()
    jbuf.deserialize(buffer, offset)
    return jbuf
  }

  constructor(value){
    this.value = value
    this.base_size = 4
  }

  get value(){
    return this._value
  }

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
    debug('deserialize buffer', this.value, offset)
    return this.value
  }
}



// ## JuteTypeString

class JuteTypeString {

  static create(value){
    return new JuteTypeString(value)
  }

  static createDeserialize(buffer, offset){
    let jstr = new JuteTypeString()
    jstr.deserialize(buffer, offset)
    return jstr
  }

  constructor(value){
    this.type = JuteTypeString.type
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

class JuteTypeVector {
  
  static create(sub_type, values){ 
    return new JuteTypeVector(sub_type, values)
  }
  
  static createDeserialize(sub_type, buffer, offset){
    let jvect = new JuteTypeVector(sub_type)
    jvect.deserialize(buffer, offset)
    return jvect
  }

  constructor(sub_type, values){
    this.type = JuteTypeVector.type
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
    debug('serialize string', this.value, offset)
    let val = this.value
    // vector size + vector content
    if ( ! isArray(val) || val.length === 0 ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(this.length, offset)
    let bytesWritten = 4

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