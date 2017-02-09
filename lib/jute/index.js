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

// Constants.
//const SPECIFICATION_FILE = './specification.json';
const PROTOCOL_VERSION = 0

const OP_CODES = require('./OpCodes')

const XID_NOTIFICATION = -1
const XID_PING = -2
const XID_AUTHENTICATION = -4
const XID_SET_WATCHES = -8

const {TransactionRequest} = require('./TransactionRequest')
const {TransactionResponse} = require('./TransactionResponse')
const {Request} = require('./Request')
const {Response} = require('./Response')

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

  // All protocols
  protocol: require('./Protocol'),

  // All types
  types: require('./Types')

}
