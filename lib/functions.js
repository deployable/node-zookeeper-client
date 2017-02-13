
const assert = require('assert')
const async = require('async')
const { ZkException } = require('./errors')
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


module.exports = { attempt }
