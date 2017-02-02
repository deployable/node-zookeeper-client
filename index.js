/**
 * Original code Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

/**
 *
 * A pure Javascript ZooKeeper client.
 *
 * @module node-zookeeper-client
 *
 */

const assert            = require('assert')

//const Promise           = require('bluebird')
const debug             = require('debug')('dply:node-zookeeper-client:index')
debug('loading')

const Client            = require('./lib/Client')
const ACL               = require('./lib/ACL')
const Id                = require('./lib/Id')
const Event             = require('./lib/Event')
const State             = require('./lib/State')
const Permission        = require('./lib/Permission')
const CreateMode        = require('./lib/CreateMode')
const Exception         = require('./lib/Exception')


// Constants.
const CLIENT_DEFAULT_OPTIONS = {
  sessionTimeout: 30000, // Default to 30 seconds.
  spinDelay: 1000, // Defaults to 1 second.
  retries: 0 // Defaults to 0, no retry.
}

const DATA_SIZE_LIMIT = 1048576 // 1 mega bytes.
const DEFAULT_PORT = 2181

/**
 * Default state listener to emit user-friendly events.
 */
function defaultStateListener(state) {
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

/**
 * Try to execute the given function 'fn'. If it fails to execute, retry for
 * 'self.options.retires' times. The duration between each retry starts at
 * 1000ms and grows exponentially as:
 *
 * duration = Math.min(1000 * Math.pow(2, attempts), sessionTimeout)
 *
 * When the given function is executed successfully or max retry has been
 * reached, an optional callback function will be invoked with the error (if
 * any) and the result.
 *
 * fn prototype:
 * function(attempts, next);
 * attempts: tells you what is the current execution attempts. It starts with 0.
 * next: You invoke the next function when complete or there is an error.
 *
 * next prototype:
 * function(error, ...);
 * error: The error you encounter in the operation.
 * other arguments: Will be passed to the optional callback
 *
 * callback prototype:
 * function(error, ...)
 *
 * @private
 * @method attempt
 * @param self {Client} an instance of zookeeper client.
 * @param fn {Function} the function to execute.
 * @param callback {Function} optional callback function.
 *
 */
function attempt(self, fn, callback) {
  let count = 0
  let retry = true
  let retries = self.options.retries
  let results = {}

  assert(typeof fn === 'function', 'fn must be a function.')

  assert(
      typeof retries === 'number' && retries >= 0,
      'retries must be an integer greater or equal to 0.'
  )

  assert(typeof callback === 'function', 'callback must be a function.')

  async.whilst(
      function () {
        return count <= retries && retry
      },
      function (next) {
        var attempts = count

        count += 1

        fn(attempts, function (error) {
            var args,
                sessionTimeout

            results[attempts] = {}
            results[attempts].error = error

            if (arguments.length > 1) {
                args = Array.prototype.slice.apply(arguments)
                results[attempts].args = args.slice(1)
            }

            if (error && error.code === Exception.CONNECTION_LOSS) {
                retry = true
            } else {
                retry = false
            }

            if (!retry || count > retries) {
                // call next so we can get out the loop without delay
                next()
            } else {
                sessionTimeout = self.connectionManager.getSessionTimeout()

                // Exponentially back-off
                setTimeout(
                    next,
                    Math.min(1000 * Math.pow(2, attempts), sessionTimeout)
                )
            }
        })
    },
    function () {
        var args = [],
            result = results[count - 1]

        if (callback) {
            args.push(result.error)
            Array.prototype.push.apply(args, result.args)

            callback.apply(null, args)
        }
    }
  )
}



/**
 * Create a new ZooKeeper client.
 *
 * @method createClient
 * @for node-zookeeper-client
 */
function createClient(connectionString, options) {
    return new Client(connectionString, options)
}

module.exports = { defaultStateListener, createClient, attempt,
            ACL, Client, Id, Permission, CreateMode, State, Event, Exception,
            CLIENT_DEFAULT_OPTIONS, DATA_SIZE_LIMIT, DEFAULT_PORT}

debug('loaded')
