const debug = require('debug')('dply:node-zookeeper-client:jute:Data')

const { ZkJute } = require('./ZkJute')
const { Record } = require('./Record')
//const { JuteError } = require('./errors')

class DataRecord {

  static create(sub_type, ...values){
    return new JuteTypeData(sub_type, ...values)
  }

  static createDeserialize(sub_type, buffer, offset){
    let jdata = new JuteTypeData(sub_type)
    jdata.deserialize(buffer, offset)
    return jdata
  }

  constructor(sub_type, ...values){
    this.type = JuteTypeData.type
    this.sub_type = sub_type
    this.sub_type_obj = JuteData.types[sub_type]
    if (!this.sub_type_obj) throw new JuteError(`No Jute "Data" type "${sub_type}"`)
    this.value = values
  }

  get value(){
    return this._value
  }

  set value(val){
    debug('set data', val, this.sub_type)
    this._value = ( val instanceof Record )
      ? val
      : JuteData.create(this.sub_type, ...val)
  }

  toString(){
    return `Data.${this.sub_type}`
  }

  serialize(buffer, offset){
    this.value.serialize(buffer, offset)
    return this
  }

  deserialize(buffer, offset){
    // lazy load the dep to avoid circular deps
    this.value = JuteData.create(this.sub_type)
    this.value.deserialize(buffer, offset)
    return this.bytes
  }
}
DataRecord.type = 'data'


class JuteData extends ZkJute {}


module.exports = {
  JuteData,
  JuteTypeZkId,
  JuteTypeZkACL,
  JuteTypeZkStat
} 
