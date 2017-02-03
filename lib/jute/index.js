/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

/**
 * Automatically generate all ZooKeeper related protocol classes.
 *
 * @module zookeeper.jute
 */

const { JuteError, JuteTypeError } = require('./errors')
const { forEach, isArray } = require('lodash')

// Constants.
//const SPECIFICATION_FILE = './specification.json';
const PROTOCOL_VERSION = 0

const OP_CODES = {
  NOTIFICATION: 0,
  CREATE: 1,
  DELETE: 2,
  EXISTS: 3,
  GET_DATA: 4,
  SET_DATA: 5,
  GET_ACL: 6,
  SET_ACL: 7,
  GET_CHILDREN: 8,
  SYNC: 9,
  PING: 11,
  GET_CHILDREN2: 12,
  CHECK: 13,
  MULTI: 14,
  AUTH: 100,
  SET_WATCHES: 101,
  SASL: 102,
  CREATE_SESSION: -10,
  CLOSE_SESSION: -11,
  ERROR: -1
}

const XID_NOTIFICATION = -1
const XID_PING = -2
const XID_AUTHENTICATION = -4
const XID_SET_WATCHES = -8




function byteLength(type, value) {

  types = { 
    int: ()=> {return 4},
    long: ()=> {return 8},
    boolean: ()=> {return 1},

    buffer: (value)=> {
      if (Buffer.isBuffer(value)) return 4 + value.length
      return 4
    },

    ustring: (value)=> {
      if (typeof value === 'string') return 4 + Buffer.byteLength(value)
      return 4
    },

    vector: (type, value)=>{
      let size = 4
      if (isArray(value)) forEach(value, item => size += byteLength(type, item))
      return size
    },

    data: (type, value)=>{
      return value.byteLength()
    }
  }

  throw new Error('Unknown type: ' + type)

}

function prependChroot(self, path) {
    if (!self.chrootPath) {
        return path
    }

    if (path === '/') {
        return self.chrootPath
    }

    return self.chrootPath + path
}





// Exports constants
module.exports = {
  JuteError,
  JuteTypeError,

  PROTOCOL_VERSION,
  OP_CODES,
  XID_NOTIFICATION,
  XID_PING,
  XID_AUTHENTICATION,
  XID_SET_WATCHES,

  // Exports classes
  Request,
  Response,

  // TODO: Consider move to protocol namespace
  TransactionRequest,
  TransactionResponse,
}

