/**
 * This class represent the response that ZooKeeper sends back to the client.
 *
 * @class Responsee
 * @constructor
 * @param header {Record} The request header record.
 * @param payload {payload} The request payload record.
 */

const { forEach } = require('lodash')
const {ZkJuteProtocol, ResponseHeader} = require('./Protocol')


class Response {

  static init(){
    forEach(ZkJuteProtocol, (protoCls, key) => {
      if ( !key.endsWith('Response') ) return
      this[key] = function(...args){
        let header = ResponseHeader.code(protoCls.op_code)
        let payload = new protoCls(...args)
        return new Request(header, payload)
      }
    })
  }

  constructor(header, payload) {
    this.header = header
    this.payload = payload
  }

}

Response.init()

module.exports = { Response }