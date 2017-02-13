
const { forEach, invert } = require('lodash')


class ZkError extends Error {
  constructor( message ){
    super(message)
    this.name = this.constructor.name;
    ( Error.captureStackTrace ) 
      ? Error.captureStackTrace(this, this.constructor)
      : this.stack = (new Error(message)).stack
  }
}


class ZkTypeError extends ZkError {
  constructor( message, options = {} ){
    super( message, options )
    this.type = options.type
    this.value = options.value
  }
}

class ZkPathError extends ZkError {
  constructor( message, options = {} ){
    super( message, options )
    this.path = options.path
  }
}


// All error ZkException codes.
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

const MESSAGES = {
  0: 'Eveything is Ok',
  '-1': 'There was a system error on the server',
  '-2': 'There was a runtime inconsistency on the server',
  '-5': 'The server had an error marshalling the provided',
  '-6': 'The request op code sent to the server is not implemented',
  '-7': 'The operation timed out on the server',
  '-8': 'The operation had bad arguments'
}


/**
 * ZkException class for all zookeeper errors.
 *
 * @class ZkException
 * @constructor
 * @private
 * @param code {Number} ZkException code.
 * @param name {String} Name of the exception.
 * @param path {String} Node path of the exception, optional.
 * @param ctor {String} The function to start in stack trace.
 */

class ZkException extends Error {

  static init(){
    forEach(CODES, (value, key)=> this[key] = value)
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
    if ( ZkException.NAMES[code] ) return true
    throw new ZkError(`Unknown Error code "${code}"`)
  }


  /**
   * The factory method to create an instance of ZkException.
   *
   * @method create
   * @param code {Number} ZkException code.
   * @param path {String} Node path of the exception, optional.
   */
  static create(code, path) {
    ZkException.validateCode(code)
    let name = ZkException.NAMES[code]
    return new ZkException(code, name, path, ZkException.create)
  }

  constructor(code, name, path, ctor) {
    super(name)
    if (!ctor) {
      ctor = path
      path = undefined
    }

    ZkException.validateCode(code)
    
    if ( !name || typeof name !== 'string')
      throw new ZkError('ZkException name must be a non-empty string.')
    
    if (typeof ctor !== 'function')
      throw new ZkError('ZkException ctor must be a function.')

    Error.captureStackTrace(this, ctor || ZkException)
    this.code = code
    this.name = name
    this.path = path

    this.message = `ZkException: ${name}[${code}]`

    if (path) this.message = `${this.message}@${path}`
  }
 
  checkCode(val){
    return ( typeof val === 'number' )
      ? ( this.code === val )
      : ( this.code === CODES[val] )
  }

  /**
   * Return the code of the ZkException.
   *
   * @method getCode
   * @return {Number} The code.
   */
  getCode () {
    return this.code
  }

  /**
   * Return the name of the ZkException.
   *
   * @method getName
   * @return {String} The name.
   */
  getName () {
    return this.name
  }

  /**
   * Return the path of the ZkException.
   *
   * @method getPath
   * @return {String} The path.
   */
  getPath () {
    return this.path
  }

  /**
   *
   * @method toString
   * @return {String} The readable form of the exception.
   */
  toString () {
    return this.message
  }

}
ZkException.init()


module.exports = {
  ZkError,
  ZkTypeError,
  ZkPathError,
  ZkException,
  MESSAGES,
  CODES
}
