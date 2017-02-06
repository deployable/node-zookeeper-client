const debug = require('debug')('dply:node-zookeeper-client:jute:JuteTypeHelper')

let JuteData, Record


class JuteTypeHelper {

  static tint(i){
    debug('tint', i)
    if (typeof i === 'number') return i
    return 0
  }

  static tlong(larg){
    debug('tlong arg', larg)
    let long = new Buffer(8)
    if (Buffer.isBuffer(larg)) {
      larg.copy(long)
      debug('tlong res', long)
      return long
    }
    long.fill(0)
    debug('tlong res', long)
    return long
  }

  static tbuffer(barg){
    debug('tbuffer', barg)
    if ( !Buffer.isBuffer(barg) ) return undefined
    let buf = new Buffer(barg.length)
    barg.copy(buf)
    return buf
  }

  static tustring(sarg){
    debug('tustring', sarg)
    if ( typeof sarg === 'string' ) return sarg
    return undefined
  }

  static tboolean(barg){
    debug('tboolean', barg)
    if ( typeof barg === 'boolean' ) return barg
    return false
  }

  static tvector(varg){
    debug('tvector', varg)
    if ( Array.isArray(varg) ) return varg
    return undefined
  }

  static tdata(darg, data_type){
    debug('tdata', darg, data_type)
    return ( darg instanceof JuteTypeHelper.Record)
      ? darg
      : JuteTypeHelper.JuteData.create(data_type)
  }

  // might be better than `require()` caching?
  static get JuteData(){
    if (JuteData) return JuteData
    JuteData = require('./Data').JuteData
    debug('stored JuteData', JuteData.name)
    return JuteData
  }

  static get Record(){
    if (Record) return Record
    Record = require('./Record').Record
    debug('stored Record', Record.name)
    return Record
  }

}

module.exports = JuteTypeHelper