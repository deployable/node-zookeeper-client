/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


/**
 * ZooKeeper client state class.
 *
 * @class State
 * @constructor
 * @private
 * @param name {String} The name of the state.
 * @param code {Number} The code of the state.
 */

class State {

  // C
  // if (state === 0) return "CLOSED_STATE";
  // if (state === ZOO_CONNECTING_STATE) return "CONNECTING_STATE";
  // if (state === ZOO_ASSOCIATING_STATE) return "ASSOCIATING_STATE";
  // if (state === ZOO_CONNECTED_STATE) return "CONNECTED_STATE";
  // if (state === ZOO_READONLY_STATE) return "READONLY_STATE";
  // if (state === ZOO_EXPIRED_SESSION_STATE) return "EXPIRED_SESSION_STATE";
  // if (state === ZOO_AUTH_FAILED_STATE) return "AUTH_FAILED_STATE";

  static init(){
    this.CONNECTING           = new State('CONNECTING', 1)
    this.ASSOCIATING          = new State('ASSOCIATING', 2)
    this.CONNECTED            = new State('CONNECTED', 3)
    this.CONNECTED_READ_ONLY  = new State('CONNECTED_READ_ONLY', 5)
//    this.SASL_AUTHENTICATED   = new State('SASL_AUTHENTICATED', 6)
    this.EXPIRED_SESSION      = new State('EXPIRED_SESSION', -112)
    this.AUTH_FAILED          = new State('AUTH_FAILED', -113)
    this.CLOSED               = new State('CLOSED', -1)
    this.CLOSING               = new State('CLOSING', -1)
    this.DISCONNECTED         = new State('CLOSED', -5)
  }

  /**
   * Default state listener to emit user-friendly events.
   */

  static defaultStateListener(state) {
    switch (state) {

      case State.DISCONNECTED:
        this.emit('disconnected')
        break

      case State.CONNECTED:
        this.emit('connected')
        break

      case State.CONNECTED_READ_ONLY:
        this.emit('connectedReadOnly')
        break

      case State.EXPIRED:
        this.emit('expired')
        break

      case State.AUTH_FAILED:
        this.emit('authenticationFailed')
        break

      default:
        return
    }
  }

  constructor (name, code) {
    if ( !name || typeof name !== 'string' )
      throw new Error('name must be a non-empty string.')

    if ( typeof code !== 'number' )
      throw new Error('type must be a number.')

    this.name = name
    this.code = code
  }

  /**
   * Return the name of the state.
   * @method getName
   * @return {String} The name o fhte state.
   */
  getName () {
    return this.name
  }

  /**
   * Return the code of the state.
   * @method getCode
   * @return {Number} The code of the state.
   */
  getCode () {
    return this.code
  }

  /**
   * Return a string representation of the state.
   *
   * @method toString
   * @return {String} The string representation of the state.
   */
  toString () {
    return `${this.name}[${this.code}]`
  }

}
State.init()

// Exported state constants
module.exports = State
