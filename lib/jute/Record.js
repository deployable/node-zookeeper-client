const debug = require('debug')('dply:node-zookeer-client:jute:Record')

const { forEach } = require('lodash')

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

  static init() {
  }

  constructor() {
    this._spec = this.constructor.spec
    this._chroot_path = undefined
    this._order = this.constructor.spec.order
    this._attributes = this.constructor.spec.attributes
  }

  set path(val){
    this._path = val
  }

  get path(){
    if ( this._chroot_path ) return this._chroot_path + this._path
    return this._path
  }

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

    let myTypes = this._attributes
    this._order.forEach(attribute => {
      let value = this[attribute]
      size += byteLength(myTypes[attribute].type, value)
    })

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

    if ( offset < 0 || offset >= buffer.length )
      throw new Error('offset: ' + offset + ' is out of buffer range.')

    let size = this.byteLength()

    if ( offset + size > buffer.length )
      throw new Error('buffer does not have enough space.')

    let myTypes = this._attributes
    // lazy load circular dep :/
    let {Serialize} = require('./Serialize')

    forEach(this._order, attribute => {
      offset += Serialize.byType(
        myTypes[attribute].type,
        this[attribute],
        buffer,
        offset
      )
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

    let bytesRead = 0
    let result = null
    // lazy load circular dep :/
    let {Deserialize} = require('./Deserialize')

    let my_types = this._attributes
    debug('%s deserialize %s', this.constructor.name, this._spec.order, my_types)
    forEach(this._order, attribute => {
      result = Deserialize.byType(my_types[attribute].type, buffer, offset + bytesRead)
      this[attribute] = result.value
      bytesRead += result.bytesRead

      // Remove the chroot part from the real path.
      if (this.chrootPath && attribute === 'path') {
        (this.path === this.chrootPath)
          ? this.path = '/'
          : this.path = this.path.substring(this.chrootPath.length)
      }
    })

    return bytesRead
  }

  prependChroot(path) {
    if (!this.chrootPath) return path

    if (path === '/') return this.chrootPath

    return `${this.chrootPath}${path}`
  }


}
Record.init()

module.exports = { Record }