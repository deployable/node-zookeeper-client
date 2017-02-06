const debug = require('debug')('dply:zk-client:jute:Types')

const { isNumber,
      isBuffer,
      isString,
      isBoolean,
      isArray,
      reduce,
      map } = require('lodash')

//const { JuteError } = require('./errors')
const { Record } = require('./Record')
const { JuteData } = require('./Data')


class JuteTypeInt {
  static create(value){
    return new JuteTypeInt(value)
  }
  constructor(value){
    this.type = JuteTypeInt.type
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
  }
  deserialize(buffer, offset){
    this.value = buffer.readInt32BE(offset)
    debug('deserialize int', this.value)
  }
}
JuteTypeInt.type = 'int'


class JuteTypeLong {
  static create(value){
    return new JuteTypeLong(value)
  }
  constructor(value){
    this.type = JuteTypeInt.type
    this.bytes = 8
    this.value = value
    this.base_size = 8
  }
  get value(){
    return this._value
  }
  set value (val){
    debug('set long', val)
    this._value = new Buffer(8)
    if ( isBuffer(val) ){
      val.copy(this._value)
      return this._value
    }
    this._value.fill(0)
  }
  toString(){
    return this.value.toString()
  }
  serialize(buffer, offset){
    debug('serialize long', this.value)
    this.value.copy(buffer, offset)
    return this.bytes
  }
  deserialize(buffer, offset){
    this.value = buffer.copy(this.value, 0, offset, offset + 8)
    debug('deserialize long', this.value)
    return this.value
  }
}
JuteTypeInt.type = 'long'


class JuteTypeBoolean {
  static create(value){
    return new JuteTypeBoolean(value)
  }
  constructor(value){
    this.type = JuteTypeBoolean.type
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
    debug('serialize boolean', this.value)
    buffer.writeUInt8(Boolean(value), offset)
    return this.bytes
  }
  deserialize(buffer, offset){
    this.value = Boolean(buffer.readUInt8(offset))
    debug('deserialize boolean', this.value)
    return this.value
  }
}
JuteTypeBoolean.type = 'boolean'


class JuteTypeBuffer {
  static create(value){
    return new JuteTypeBuffer(value)
  }
  constructor(value){
    this.type = JuteTypeBuffer.type
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
    return 4 + this.value.length
  }
  toString(){
    return this.value.toString()
  }
  serialize(buffer, offset){
    debug('serialize buffer', this.value)
    if ( ! Buffer.isBuffer(value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(value.length, offset)
    let bytesWritten = 4

    value.copy(buffer, offset + bytesWritten)
    bytesWritten += value.length
    return this.bytes
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
    debug('deserialize buffer', this.value)
    return this.value
  }
}
JuteTypeBuffer.type = 'buffer'


class JuteTypeUString {
  static create(value){
    return new JuteTypeUString(value)
  }
  constructor(value){
    this.type = JuteTypeUString.type
    this.value = value
    this.base_size = 4
  }
  get value(){
    return this._value
  }
  set value(val){
    debug('set ustring', val)
    if ( isString(val) ) return this._value = val
    this._value = undefined
  }
  get bytes(){
    if ( isString(this.value) ) return 4 + Buffer.byteLength(this.value)
    return 4
  }
  toString(){
    return `${this.value}`
  }
  serialize(buffer, offset){
    debug('serialize ustring', this.value)
    if ( ! isString(value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }
    
    let length = this.bytes
    buffer.writeInt32BE(length, offset)
    let bytesWritten = 4

    new Buffer(this.value).copy(buffer, offset + bytesWritten)
    bytesWritten += length

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

    debug('deserialize ustring', this.value)
    return this.value
  }
}
JuteTypeUString.type = 'ustring'


class JuteTypeVector {
  static create(sub_type, values){ 
    return new JuteTypeVector(sub_type, values)
  }
  static data(data_type){ 
    return new JuteTypeVector(new JuteTypeData(data_type))
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
    this._value = map(val, (v) => JuteTypeLookup.create(this.sub_type, v))
  }
  get bytes(){
    if ( ! isArray(this.value) ) return 4
    
    return reduce(this.value, (sum, v) => {
        return (v.bytes) ? sum + v.bytes : sum
    }, 4)
  }
  toString(){
    return `vector<${this.sub_type}>`
  }
  serialize(buffer, offset){
    // vector size + vector content
    if ( ! isArray(this.value) ) {
      buffer.writeInt32BE(-1, offset)
      return 4
    }

    buffer.writeInt32BE(this.value.length, offset)
    let bytesWritten = 4

    forEach(this.value, item => {
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
      let item = JuteTypeLookup.create(this.sub_type)
      item.deserialize(buffer, offset + bytesRead)
      this.value.push(item)
      bytesRead += item.bytes
      length -= 1
    } 
    return this.value
  }
}
JuteTypeVector.type = 'vector'


class JuteTypeData {
  static create(sub_type){ 
    return new JuteTypeData(sub_type)
  }
  constructor(sub_type, value){
    this.type = JuteTypeData.type
    this.sub_type = sub_type
    this.value = value
  }
  get value(){
    return this._value
  }
  set value(val){
    debug('set data', val, this.sub_type)
    this._value = ( val instanceof Record )
      ? val
      : JuteTypeLookup.create(this.sub_type, val)
  }
  toString(){
    return `Data.${this.sub_type}`
  }
  serialize(buffer, offset){
    this.value.serialize(value, buffer, offset)
    return this.bytes
  }
  deserialize(buffer, offset){
    // lazy load the dep to avoid circular deps
    this.value = JuteData.create(this.sub_type)
    this.value.deserialize(buffer, offset)
    return this.value
  }
}
JuteTypeData.type = 'data'


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
  ustring: JuteTypeUString,
  vector: JuteTypeVector,
  Data: JuteTypeData 
}


module.exports = { 
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeUString,
  JuteTypeVector,
  JuteTypeData,
  JuteTypeLookup
}