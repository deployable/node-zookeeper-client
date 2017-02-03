const { JuteError } = require('./errors')

class Jute {

  static create(type, ...args) {
    if (!this.types[type]) throw new JuteError(`No Jute type "${type}" to create`)
    return new this.types[type](...args)
  }

  static tint(i){
    if (typeof i === 'number') return i
    return 0
  }

  static tlong(larg){
    let long = new Buffer(8)
    if (Buffer.isBuffer(larg)) return larg.copy(long)
    return larg.fill(0)
  }

  static tbuffer(barg){
    if ( !Buffer.isBuffer(barg) ) return undefined
    let buf = new Buffer(barg.length)
    barg.copy(buf)
    return buf
  }

  static tustring(sarg){
    if ( typeof sarg === 'string' ) return sarg
    return undefined
  }

  static tboolean(barg){
    if ( typeof barg === 'boolean' ) return barg
    return false
  }

  static tvector(varg){
    if ( Array.isArray(varg) ) return varg
    return undefined
  }

  static tdata(darg, data_type){
    return ( darg instanceof Record)
      ? darg
      : new Data.create(data_type)()
  }

}

module.exports = { Jute }
