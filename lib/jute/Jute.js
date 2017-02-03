const debug = require('debug')('dply:node-zookeeper-client:jute:Jute')

const { JuteError } = require('./errors')


class Jute {

  static init(){
    // This would normally hold all the record types. 
    this.types = {}
  }

  static create(type, ...args) {
    if (!this.types[type]) throw new JuteError(`No Jute type "${type}" to create`)
    return new this.types[type](...args)
  }
  
}
Jute.init()


module.exports = { Jute }
