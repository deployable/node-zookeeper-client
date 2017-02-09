/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const { ZkError } = require('./errors')
const jute = require('./jute')
const { isArray, isString, isNumber, uniq, reduce, chain} = require('lodash')
const {Id} = require('./Id')


class Permission {

  static init(){
    this.lookup = {
      r: 1,
      w: 2,
      c: 4,
      d: 8,
      a: 16,
      all: 31
    }
  }

  static create(str){
    if (str === 'all') return 31
    let total = chain(str)
      .split('')
      .uniq()
      .reduce((sum, char) => { return sum + this.lookup[char]}, 0)
      .value()
    if ( !isNumber(total) ) throw new ZkError(`Couldn't lookup permission string ${str}, ${total}`)
    return total
  }

}
Permission.init()


class ACL {

  static init(){
    this.Permission = Permission
    this.OPEN_ACL_UNSAFE = [new ACL('all', Id.ANYONE_ID_UNSAFE)],
    this.READ_ACL_UNSAFE = [new ACL('r', Id.ANYONE_ID_UNSAFE)],
    this.CREATOR_ALL_ACL = [new ACL('all', Id.AUTH_IDS)]
  }

  static world(perm){
    return new ACL(perm, Id.ANYONE_ID_UNSAFE)
  }

  static auth(id, perm){
    return new ACL(perm, Id.auth(id))
  }

  static digest(id, perm){
    return new ACL(perm, Id.digest(id))
  }

  static host(id, perm){
    return new ACL(perm, Id.host(id))
  }

  static ip(id, perm){
    return new ACL(perm, Id.ip(id))
  }

  static fromRecord(record) {
    if (!(record instanceof jute.protocol.JuteDataZkACL)) {
      throw new ZkError('record must be an instace of jute.data.ACL.')
    }
    return new ACL(record.perms, Id.fromRecord(record.id.value))
  }

  constructor(permission, id) {
    if ( isString(permission) )
      permission = Permission.create(permission)

    if ( !isNumber(permission) || permission < 1 || permission > 31 )
      throw new ZkError(`ACL permission must be a valid integer. ${permission}`)

    if ( isArray(id) )
      id = new Id(...id)

    if ( !(id instanceof Id) )
      throw new ZkError('ACL id must be an instance of the Id class.')

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

module.exports = { ACL, Permission }
