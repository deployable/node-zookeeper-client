/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const { ZkError } = require('./errors')
const jute = require('./jute')
const {Id} = require('./Id')
const {PERMISSION} = require('./constants')

class ACL {

  static init(){
    this.OPEN_ACL_UNSAFE = [new ACL(PERMISSION.ALL, Id.ANYONE_ID_UNSAFE)],
    this.CREATOR_ALL_ACL = [new ACL(PERMISSION.ALL, Id.AUTH_IDS)],
    this.READ_ACL_UNSAFE = [new ACL(PERMISSION.READ, Id.ANYONE_ID_UNSAFE)]
  }

  static fromRecord(record) {
    if (!(record instanceof jute.protocol.JuteDataZkACL)) {
      throw new ZkError('record must be an instace of jute.data.ACL.')
    }
    return new ACL(record.perms, Id.fromRecord(record.id.value))
  }

  constructor(permission, id) {
    if ( typeof permission !== 'number' || permission < 1 || permission > 31 )
      throw new ZkError('permission must be a valid integer.')

    if ( !(id instanceof Id) )
      throw new ZkError('id must be an instance of Id class.')

    this.permission = permission
    this.id = id
  }

  toRecord () {
    return new jute.protocol.JuteDataZkACL(
      this.permission,
      this.id.toRecord()
    )
  }

}

ACL.init()

module.exports = {ACL}
