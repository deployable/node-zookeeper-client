const debug = require('debug')('dply:node-zookeeper-client:jute:Record')

const { forEach, 
      sampleSize, 
      isArray }   = require('lodash')

const { 
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeString,
  JuteTypeVector,
  JuteTypeData,
  JuteTypeLookup
}                 = require('./Types')


const {RANDOM_STRING_LOWER_SET} = require('../constants')
const {JuteError} = require('./errors')
// circular :/
//const {Deserialize} = require('./Deserialize')
//const {Serialize} = require('./Serialize')

/**
 * The prototype class for all Zookeeper jute protocol classes.
 *
 * @class Record
 * @constructor
 * @param specification {Array} The array of record attribute specification.
 * @param args {Array} The constructor array of the Record class.
 */

class Record {

  static create(...args){
    return new this(...args)
  }

  static init() {
  }

  // new Record(), would normally come from JuteData or JuteProtocol extending a Record

  constructor(...args) {
    this._uid = sampleSize(RANDOM_STRING_LOWER_SET,6).join('')
    debug('created Record [%s]', this._uid)
    this._chroot_path = undefined

    //this._spec = this.constructor.spec
    this._order = this.constructor.spec.order
    this._attributes = this.constructor.spec.attributes
  }

  set path(val){
    // Remove the chroot part from the real path.
    if (this._chroot_path) {
      val = (val === this._chroot_path)
        ? '/'
        : val.substring(this._chroot_path.length)
    }
    this._path = JuteTypeString.create(val)
  }

  get path(){
    if ( this._chroot_path ) return this._chroot_path + this._path
    return this._path
  }

  get data(){ return this._data }
  set data(val){
    this._data = JuteTypeBuffer.create(val)
  }

  get acl(){ return this._acl }
  set acl(val){
    this._acl = JuteTypeVector.create(val, 'data.ACL')
  }

  get flags(){ return this._flags}
  set flags(val){
    this._flags = JuteTypeInt.create(val)
  }

  get version()   { return this._version }
  set version(val){ this._version = JuteTypeInt.create(val) }

  set dataWatches(val){ this._dataWatches = val}
  get dataWatches(){
    let dw = this._dataWatches
    if ( Array.isArray(dw) ) return dw.map(path => this.prependChroot(path))
    return dw
  }

  set existWatches(val){ this._existWatches = val}
  get existWatches(){
    let dw = this._existWatches
    if ( Array.isArray(dw) ) return dw.map(path => this.prependChroot(path))
    return dw
  }
  
  set childWatches(val){ this._childWatches = val}
  get childWatches(){
    let dw = this._childWatches
    if ( Array.isArray(dw) ) return dw.map(path => this.prependChroot(path))
    return dw
  }

  get xid(){ return this._xid}
  set xid(val){ this._xid = JuteTypeInt.create(val) }

  get zxid(){ return this._zxid}
  set zxid(val){ this._zxid = JuteTypeInt.create(val) }

  get err(){ return this._err}
  set err(val){ this._err = JuteTypeInt.create(val) }

  getAttributeOrder(){
    return this._order
  }

  getAttributeType(attribute){
    let attrib = this._attributes[attribute]
    if (!attrib) throw new JuteError(`No attribute ${type} on ${this.constructor.name}`)
    return attrib.type
  }

  getAttributeSubType(attribute){
    let attrib = this._attributes[attribute]
    if (!attrib) throw new JuteError(`No attribute ${type} on ${this.constructor.name}`)
    return attrib.sub_type
  }

  setChrootPath(path) {
    this._chroot_path = path
  }

  /**
   * Calculate and return the size of the buffer which is need to serialize this
   * record.
   *
   * @method byteLength
   * @return {Number} The number of bytes.
   */
  byteLength() {
    let size = 0

    forEach(this._order, attribute => {
      debug('%s[%s] byte length attribute: %s', this.constructor.name, this._uid, attribute, this[attribute])
      size += this[attribute].bytes
    })

    debug('%s[%s] byte length: %s', this.constructor.name, this._uid, size)
    this.bytes = size
    return size
  }

  /**
   * Serialize the record content to a buffer.
   *
   * @method serialize
   * @param buffer {Buffer} A buffer object.
   * @param offset {Number} The offset where the write starts.
   * @return {Number} The number of bytes written.
   */
  serialize(buffer, offset) {
    if ( !Buffer.isBuffer(buffer) )
      throw new Error('buffer must an instance of Node.js Buffer class.')

    if ( offset < 0 || offset > buffer.length )
      throw new Error(`offset: ${offset} is out of buffer range "${buffer.length}".`)

    let size = this.byteLength()

    if ( offset + size > buffer.length )
      throw new Error('buffer does not have enough space.')

    debug('%s[%s] serialize %s', this.constructor.name, this._uid, this._order, offset)
    this._order.forEach(attribute => {
      offset += this[attribute].serialize(buffer, offset)
    })

    return size
  }



  /**
   * De-serialize the record content from a buffer.
   *
   * @method deserialize
   * @param buffer {Buffer} A buffer object.
   * @param offset {Number} The offset where the read starts.
   * @return {Number} The number of bytes read.
   */
  deserialize(buffer, offset) {
    if ( !Buffer.isBuffer(buffer) )
      throw new Error('buffer must an instance of Node.js Buffer class.')

    if ( offset < 0 || offset >= buffer.length )
      throw new Error('offset: ' + offset + ' is out of buffer range.')

    debug('%s[%s] deserialize %s', this.constructor.name, this._uid, this._order)

    let bytesRead = 0
    this._order.forEach(attribute => {
      this[attribute].deserialize(buffer, offset + bytesRead)
      bytesRead += this[attribute].bytes
      debug('bytesRead', bytesRead)
    })

    this.bytes = bytesRead
    return bytesRead
  }

}
Record.init()

module.exports = { Record }