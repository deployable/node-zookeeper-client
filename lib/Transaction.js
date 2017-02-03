/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const assert            = require('assert')

const {forEach}         = require('lodash')

const jute              = require('./jute')
const Path              = require('./Path')
const ACL               = require('./ACL')
const Exception         = require('./Exception')
const { CREATE_MODES }  = require('../constants')
const ConnectionManager = require('./ConnectionManager')

/**
 * Transaction provides a builder interface that helps building an atomic set
 * of operations.
 *
 * @class Transaction
 * @constructor
 * @param connectionManager {ConnectionManager} an instance of ConnectionManager.
 */
class Transaction {

  constructor (connectionManager) {
    assert(
      connectionManager instanceof ConnectionManager,
      'connectionManager must be an instance of ConnectionManager.'
    )

    this.ops = []
    this.connectionManager = connectionManager
  }


  /**
   * Add a create operation with given path, data, acls and mode.
   *
   * @method create
   * @param path {String} The znode path.
   * @param [data=undefined] {Buffer} The data buffer.
   * @param [acls=ACL.OPEN_ACL_UNSAFE] {Array} An array of ACL object.
   * @param [mode=CREATE_MODES.PERSISTENT] {CREATE_MODES} The creation mode.
   * @return {Transaction} this transaction instance.
   */
  create (path, data, acls, mode) {
    let optionalArgs = [data, acls, mode]

    Path.validate(path)

    // Reset arguments so we can reassign correct value to them.
    data = acls = mode = undefined
    optionalArgs.forEach(arg => {
      if (Array.isArray(arg)) {
        acls = arg
      } else if (typeof arg === 'number') {
        mode = arg
      } else if (Buffer.isBuffer(arg)) {
        data = arg
      }
    })

    acls = Array.isArray(acls) ? acls : ACL.OPEN_ACL_UNSAFE
    mode = typeof mode === 'number' ? mode : CREATE_MODES.PERSISTENT

    assert(
      data === null || data === undefined || Buffer.isBuffer(data),
      'data must be a valid buffer, null or undefined.'
    )

    assert(acls.length > 0, 'acls must be a non-empty array.')

    this.ops.push({
      type: jute.OP_CODES.CREATE,
      path: path,
      data: data,
      acls: acls,
      mode: mode
    })

    return this
  }

  /**
   * Add a check (existence) operation with given path and optional version.
   *
   * @method check
   * @param path {String} The znode path.
   * @param [version=-1] {Number} The version of the znode.
   * @return {Transaction} this transaction instance.
   */
  check ( path, version = -1 ) {
    Path.validate(path)
    assert( typeof version === 'number', 'version must be a number.' )

    this.ops.push({
      type: jute.OP_CODES.CHECK,
      path: path,
      version: version
    })

    return this
  }

  /**
   * Add a set-data operation with the given path, data and optional version.
   *
   * @method setData
   * @param path {String} The znode path.
   * @param data {Buffer} The data buffer.
   * @param [version=-1] {Number} The version of the znode.
   * @return {Transaction} this transaction instance.
   */
  setData ( path, data, version = -1 ) {
    Path.validate(path)
    assert(
      data === null || data === undefined || Buffer.isBuffer(data),
      'data must be a valid buffer, null or undefined.'
    )
    assert( typeof version === 'number',
      'version must be a number.')

    this.ops.push({
      type: jute.OP_CODES.SET_DATA,
      path: path,
      data: data,
      version: version
    })

    return this
  }

  /**
   * Add a delete operation with the given path and optional version.
   *
   * @method delete
   * @param path {String} The znode path.
   * @param [version=-1] {Number} The version of the znode.
   * @return {Transaction} this transaction instance.
   */
  remove ( path, version = -1 ) {
    Path.validate(path)
    assert(typeof version === 'number', 'version must be a number.')

    this.ops.push({
      type: jute.OP_CODES.DELETE,
      path: path,
      version: version
    })

    return this
  }

  /**
   * Execute the transaction atomically.
   *
   * @method commit
   * @param callback {Function} callback function.
   */
  commit (callback) {
    let header = new jute.protocol.RequestHeader()
    let payload = new jute.TransactionRequest(this.ops)
    let request

    header.type = jute.OP_CODES.MULTI
    request = new jute.Request(header, payload)

    this.connectionManager.queue(request, (error, response) => {
      if (error) return callback(error)
      forEach(response.payload.results, result => {
        // Find if there is an op which caused the transaction to fail.
        if (result.type === jute.OP_CODES.ERROR && result.err !== Exception.OK) {
          error = Exception.create(result.err)
          return false
        }
      })

      callback && callback(error, response.payload.results)
    })
  }

}

module.exports = Transaction
