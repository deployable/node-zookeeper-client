/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {forEach, isBuffer, isArray, isNil } = require('lodash')

const jute              = require('./jute')
const {Validate}        = require('./Validate')
const {ACL}             = require('./ACL')
const {ZkError, ZkException} = require('./errors')
const { CREATE_MODES }  = require('./constants')
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
    if ( ! connectionManager instanceof ConnectionManager )
      throw new JuteError('The Transcation connectionManager must be an instance of ConnectionManager.')
    this.connectionManager = connectionManager
    this.ops = []
  }

  optionsData(data){
    if ( isBuffer(data) || isNil(data) ) return data
    throw new ZkError('Create "data" must be a buffer, null or undefined')
  }
 
  optionsVersion(version){
    if ( version === undefined )
      return version = -1

    if ( typeof version !== 'number' )
      throw new ZkError('The "version" must be a number.')
  
    return version
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
  create ( path, options = {} ){
    Validate.path(path)
    let data = this.optionsData(options.data)
    let acls = isArray(options.acls) ? options.acls : ACL.OPEN_ACL_UNSAFE
    if ( acls.length <= 0 ) throw new JuteError('Create "acls" must be a non-empty array.')
    let mode = ( typeof options.mode === 'number' ) ? options.mode : CREATE_MODES.PERSISTENT

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
  check ( path, options = {} ) {
    Validate.path(path)
    let version = this.optionsVersion(options.version)

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
  setData ( path, data, options = {} ) {
    Validate.path(path)
    data = this.optionsData(data)
    let version = this.optionsVersion(options.version)

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
  remove ( path, options = {} ) {
    Validate.path(path)
    let version = this.optionsVersion(options.version)

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
   * @return {Promise} Promise to commit the transaction
   */
  commit(){
    return new Promise((resolve) => {
      let header = jute.protocol.RequestHeader.type('MULTI')
      let payload = new jute.TransactionRequest(this.ops)
      let request = new jute.Request(header, payload)

      let prm = this.connectionManager.queue(request).then(response => {
        let results = response.payload.results
        forEach(results, result => {
          // Find if there is an op which caused the transaction to fail.
          if (result.type === jute.OP_CODES.ERROR && result.err !== ZkException.OK) {
            throw ZkException.create(result.err, {result:result})
          }
        })

        if ( this.ops.length !== results.length )
          throw new ZkError(`Transaction result length "${results.length}" didn't match original operations: "${this.ops.length}"`)

        return results
      })
      return resolve(prm)
    })
  }

}

module.exports = Transaction
