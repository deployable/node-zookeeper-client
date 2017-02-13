
const { isArray, isString, isNumber, uniq, reduce, chain} = require('lodash')

const jute = require('./jute')
const {Id} = require('./Id')
const { ZkError } = require('./errors')


class Stat {

  static init(){
  }

  static fromRecord(jute_stat){
    return new this({jute: jute_stat}))
  }

  constructor(options) {
  }

  toRecord () {
    return new jute.protocol.JuteDataZkStat(
      this.czxid,
      this.mzxid,
      this.ctime,
      this.mtime,
      this.version,
      this.cversion,
      this.aversion,
      this.ephemeralOwner,
      this.dataLength,
      this.numChildren,
      this.pzxid,
    )
  }
  
}

Stat.init()

module.exports = { Stat, ZkError }
