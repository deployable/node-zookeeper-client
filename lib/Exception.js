/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


const { invert } = require('lodash')
const assert = require('assert')


// All error codes.
const CODES = {
  OK: 0,
  SYSTEM_ERROR: -1,
  RUNTIME_INCONSISTENCY: -2,
  DATA_INCONSISTENCY: -3,
  CONNECTION_LOSS: -4,
  MARSHALLING_ERROR: -5,
  UNIMPLEMENTED: -6,
  OPERATION_TIMEOUT: -7,
  BAD_ARGUMENTS: -8,
  API_ERROR: -100,
  NO_NODE: -101,
  NO_AUTH: -102,
  BAD_VERSION: -103,
  NO_CHILDREN_FOR_EPHEMERALS: -108,
  NODE_EXISTS: -110,
  NOT_EMPTY: -111,
  SESSION_EXPIRED: -112,
  INVALID_CALLBACK: -113,
  INVALID_ACL: -114,
  AUTH_FAILED: -115
}
const MESSAGES = {}


/**
 * Exception class for all zookeeper errors.
 *
 * @class Exception
 * @constructor
 * @private
 * @param code {Number} Exception code.
 * @param name {String} Name of the exception.
 * @param path {String} Node path of the exception, optional.
 * @param ctor {String} The function to start in stack trace.
 */
class Exception extends Error {

  static init(){
    this.CODES = CODES
    this.NAMES = invert(CODES)
    this.MESSAGES = MESSAGES
  }

  /**
   * Check if the given error code is a valid code, throw an error if the
   * code is not supported.
   *
   * @method validateCode
   * @param code {Number} The error code to be checked.
   */
  static validateCode(code) {
    if ( Exception.NAMES[code] ) return true
    throw new ZkError(`Unknown Error code "${code}"`)
  }


  /**
   * The factory method to create an instance of Exception.
   *
   * @method create
   * @param code {Number} Exception code.
   * @param path {String} Node path of the exception, optional.
   */
  static create(code, path) {
    Exception.validateCode(code)
    let name = Exception.NAMES[code]
    return new Exception(code, name, path, Exception.create)
  }

  constructor(code, name, path, ctor) {
    super(name)
    if (!ctor) {
      ctor = path
      path = undefined
    }

    Exception.validateCode(code)
    assert( name && typeof name === 'string',
      'name must be a non-empty string.')
    assert(typeof ctor === 'function', 'ctor must be a function.')

    Error.captureStackTrace(this, ctor || Exception)
    this.code = code
    this.name = name
    this.path = path

    this.message = `Exception: ${name} [${code}]`

    if (path) this.message = `${this.message}@${path}`
  }

  /**
   * Return the code of the Exception.
   *
   * @method getCode
   * @return {Number} The code.
   */
  getCode () {
    return this.code
  };

  /**
   * Return the name of the Exception.
   *
   * @method getName
   * @return {String} The name.
   */
  getName () {
    return this.name
  }

  /**
   * Return the path of the Exception.
   *
   * @method getPath
   * @return {String} The path.
   */
  getPath () {
    return this.path
  };

  /**
   *
   * @method toString
   * @return {String} The readable form of the exception.
   */
  toString () {
    return this.message
  };

}
Exception.init()

module.exports = {Exception}
