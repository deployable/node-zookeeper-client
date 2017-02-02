/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


const assert = require('assert')

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
  
  /**
   * Default state listener to emit user-friendly events.
   */

  static defaultStateListener(state) {
    switch (state) {

      case State.DISCONNECTED:
        this.emit('disconnected')
        break

      case State.SYNC_CONNECTED:
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
    assert(
        name && typeof name === 'string',
        'name must be a non-empty string.'
    )
    assert(typeof code === 'number', 'type must be a number.')

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
      return this.name + '[' + this.code + ']'
  }

}
// Exported state constants
module.exports = State
module.exports.STATES = {
    DISCONNECTED: new State('DISCONNECTED', 0),
    SYNC_CONNECTED: new State('SYNC_CONNECTED', 3),
    AUTH_FAILED: new State('AUTH_FAILED', 4),
    CONNECTED_READ_ONLY: new State('CONNECTED_READ_ONLY', 5),
    SASL_AUTHENTICATED: new State('SASL_AUTHENTICATED', 6),
    EXPIRED: new State('EXPIRED', -122)
}
