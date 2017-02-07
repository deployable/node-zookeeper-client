/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {ZkError} = require('./errors')
const jute = require('./jute')


class Id {

  static init(){
    this.ANYONE_ID_UNSAFE = ANYONE_ID_UNSAFE
    this.AUTH_IDS = AUTH_IDS
  }

  static fromRecord(record) {
    if ( !(record instanceof jute.protocol.JuteDataZkId) ) 
      throw new Error('record must be an instace of JuteDataZkId.')

    return new Id(record.scheme, record.id)
  }

  constructor(scheme, id){
    if ( !scheme || typeof scheme !== 'string' )
      throw new ZkError('scheme must be a non-empty string.')

    if ( typeof id !== 'string' )
      throw new ZkError('id must be a string.')

    this.scheme = scheme
    this.id = id
  }

  toRecord(){
    return new jute.protocol.JuteDataZkId(
      this.scheme,
      this.id
    )
  }
}

ANYONE_ID_UNSAFE = new Id('world', 'anyone'),
AUTH_IDS = new Id('auth', '')

Id.init()

module.exports = {
  Id,
  ANYONE_ID_UNSAFE,
  AUTH_IDS,
}


