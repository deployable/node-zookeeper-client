
const events            = require('events')

const Promise           = require('bluebird')
const assert            = require('assert')
const uuid              = require('uuid')
const _                 = require('lodash')

const jute              = require('./jute')
const Path              = require('./Path')
const State             = require('./State')
const Transaction       = require('./Transaction')
const ConnectionManager = require('./ConnectionManager')
const { CLIENT_DEFAULT_OPTIONS } = require('../constants')

/**
 * The ZooKeeper client constructor.
 *
 * @class Client
 * @constructor
 * @param connectionString {String} ZooKeeper server ensemble string.
 * @param [options] {Object} client options.
 */

module.exports = class Client extends events.EventEmitter {

  static create(connectionString, options) {
    return new this(connectionString, options)
  }


  constructor( connectionString, options = {} ) {
    super()

    assert(
      connectionString && typeof connectionString === 'string',
      'connectionString must be an non-empty string.'
    )

    assert(
      typeof options === 'object',
      'options must be a valid object'
    )

    this.uid = uuid.v4()
    this.debug = require('debug')(`dply:node-zookeeper-client:Client[${this.uid}]`)
    this.debug('creating Client with options', connectionString, options)
    this.options = _.defaults(_.clone(options), CLIENT_DEFAULT_OPTIONS)

    this.state = State.DISCONNECTED

    this.connectionManager = new ConnectionManager(
      connectionString,
      options,
      this.onConnectionManagerState.bind(this)
    )
    
    this.on('state', State.defaultStateListener)
  }

  /**
   * Start the client and try to connect to the ensemble.
   *
   * @method connect
   */
  connect () {
    return this.connectionManager.connect()
  }

  waitConnect(){
    return this.connectionManager.waitConnect() 
  }

  /**
   * Shutdown the client.
   *
   * @method connect
   */
  close () {
    return this.connectionManager.close()
  }

  /**
   * Private method to translate connection manager state into client state.
   */
  onConnectionManagerState (state) {
    if (this.state !== state) {
      this.debug('onConnectionManagerState', this.state)
      this.state = state
      this.emit('state', this.state)
    }
  };

  /**
   * Returns the state of the client.
   *
   * @method getState
   * @return {State} the state of the client.
   */
  getState () {
    return this.state
  }

  /**
   * Returns the session id for this client instance. The value returned is not
   * valid until the client connects to a server and may change after a
   * re-connect.
   *
   * @method getSessionId
   * @return {Buffer} the session id, 8 bytes long buffer.
   */
  getSessionId () {
    return this.connectionManager.getSessionId()
  }

  /**
   * Returns the session password for this client instance. The value returned
   * is not valid until the client connects to a server and may change after a
   * re-connect.
   *
   * @method getSessionPassword
   * @return {Buffer} the session password, 16 bytes buffer.
   */
  getSessionPassword () {
    return this.connectionManager.getSessionPassword()
  }

  /**
   * Returns the negotiated session timeout for this client instance. The value
   * returned is not valid until the client connects to a server and may change
   * after a re-connect.
   *
   * @method getSessionTimeout
   * @return {Integer} the session timeout value.
   */
  getSessionTimeout () {
    return this.connectionManager.getSessionTimeout()
  }


  /**
   * Add the specified scheme:auth information to this client.
   *
   * @method addAuthInfo
   * @param scheme {String} The authentication scheme.
   * @param auth {Buffer} The authentication data buffer.
   */
  addAuthInfo (scheme, auth) {
    assert(
        scheme || typeof scheme === 'string',
        'scheme must be a non-empty string.'
    )

    assert(
        Buffer.isBuffer(auth),
        'auth must be a valid instance of Buffer'
    )

    let buffer = new Buffer(auth.length)

    auth.copy(buffer)
    this.connectionManager.addAuthInfo(scheme, buffer)
  }

  /**
   * Create a node with given path, data, acls and mode.
   *
   * @method create
   * @param path {String} The node path.
   * @param options { Object }
   *    [data=undefined] {Buffer} The data buffer.
   *    [acls=ACL.OPEN_ACL_UNSAFE] {Array} An array of ACL object.
   *    [mode=CreateMode.PERSISTENT] {CreateMode} The creation mode.
   *    callback {Function} The callback function.
   */
  //create ( path, options = {} ) {
  //  return new Promise((resolve, reject) => {
  //    data = options.data
  //    acls = options.acls
  //    mode = options.mode
  //    callback = options.callback
  create (path, data, acls, mode, callback) {

    let optionalArgs = [data, acls, mode, callback]
    let header, payload, request

    Path.validate(path)

    // Reset arguments so we can reassign correct value to them.
    data = acls = mode = callback = undefined;
    optionalArgs.forEach(function (arg, index) {
        if (Array.isArray(arg)) {
            acls = arg;
        } else if (typeof arg === 'number') {
            mode = arg;
        } else if (Buffer.isBuffer(arg)) {
            data = arg;
        } else if (typeof arg === 'function') {
            callback = arg;
        }
    })

    assert( typeof callback === 'function',
      'callback must be a function.')

    acls = Array.isArray(acls) ? acls : ACL.OPEN_ACL_UNSAFE;
    mode = typeof mode === 'number' ? mode : CreateMode.PERSISTENT;

    assert( data === null || data === undefined || Buffer.isBuffer(data),
      'data must be a valid buffer, null or undefined.')

    if (Buffer.isBuffer(data)) {
      assert( data.length <= DATA_SIZE_LIMIT,
        `data must be equal of smaller than ${DATA_SIZE_LIMIT} bytes.`)
    }

    assert(acls.length > 0, 'acls must be a non-empty array.')

    header = new jute.protocol.RequestHeader()
    header.type = jute.OP_CODES.CREATE

    payload = new jute.protocol.CreateRequest()
    payload.path = path
    payload.acl = acls.map(item => item.toRecord())
    payload.flags = mode

    if (Buffer.isBuffer(data)) {
      payload.data = new Buffer(data.length)
      data.copy(payload.data)
    }

    request = new jute.Request(header, payload)

    attempt(
      self,
      (attempts, next) => {
        this.connectionManager.queue(request, (error, response)=> {
          if (error) {
            next(error)
            return
          }

          next(null, response.payload.path)
        })
      },
      callback
    )
  }

  /**
   * Delete a node with the given path. If version is not -1, the request will
   * fail when the provided version does not match the server version.
   *
   * @method delete
   * @param path {String} The node path.
   * @param [version=-1] {Number} The version of the node.
   * @param callback {Function} The callback function.
   */
  remove (path, version, callback) {
    if (!callback) {
      callback = version
      version = -1
    }

    Path.validate(path)

    assert(typeof callback === 'function', 'callback must be a function.')
    assert(typeof version === 'number', 'version must be a number.')


    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.DeleteRequest()
    let request

    header.type = jute.OP_CODES.DELETE

    payload.path = path
    payload.version = version

    request = new jute.Request(header, payload)

    attempt(
      self,
      function (attempts, next) {
        self.connectionManager.queue(request, function (error, response) {
            next(error);
        })
      },
      callback
    )
  }

  /**
   * Set the data for the node of the given path if such a node exists and the
   * optional given version matches the version of the node (if the given
   * version is -1, it matches any node's versions).
   *
   * @method setData
   * @param path {String} The node path.
   * @param data {Buffer} The data buffer.
   * @param [version=-1] {Number} The version of the node.
   * @param callback {Function} The callback function.
   */
  setData (path, data, version, callback) {
    if (!callback) {
      callback = version
      version = -1
    }

    Path.validate(path)

    assert(typeof callback === 'function', 'callback must be a function.')
    assert(typeof version === 'number', 'version must be a number.')

    assert(
        data === null || data === undefined || Buffer.isBuffer(data),
        'data must be a valid buffer, null or undefined.'
    )
    if (Buffer.isBuffer(data)) {
        assert(
            data.length <= DATA_SIZE_LIMIT,
            'data must be equal of smaller than ' + DATA_SIZE_LIMIT + ' bytes.'
        )
    }

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.SetDataRequest()
    let request = null

    header.type = jute.OP_CODES.SET_DATA

    payload.path = path
    payload.data = new Buffer(data.length)
    data.copy(payload.data)
    payload.version = version

    request = new jute.Request(header, payload)

    attempt(
      this,
      (attempts, next) => {
        this.connectionManager.queue(request, function (error, response) {
          if (error) return next(error)
          next(null, response.payload.stat)
        })
      },
      callback
    )
  }

  /**
   *
   * Retrieve the data and the stat of the node of the given path.
   *
   * If the watcher is provided and the call is successful (no error), a watcher
   * will be left on the node with the given path.
   *
   * The watch will be triggered by a successful operation that sets data on
   * the node, or deletes the node.
   *
   * @method getData
   * @param path {String} The node path.
   * @param [watcher] {Function} The watcher function.
   * @param callback {Function} The callback function.
   */
  getData (path, watcher, callback) {
    if (!callback) {
      callback = watcher
      watcher = undefined
    }

    Path.validate(path)

    assert(typeof callback === 'function', 'callback must be a function.')

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.GetDataRequest()
    let request

    header.type = jute.OP_CODES.GET_DATA

    payload.path = path
    payload.watch = (typeof watcher === 'function')

    request = new jute.Request(header, payload)

    attempt(
        this,
        (attempts, next) => {
          self.connectionManager.queue(request, (error, response) => {
            if (error) return next(error)

            if (watcher) {
              this.connectionManager.registerDataWatcher(path, watcher)
            }

            next(null, response.payload.data, response.payload.stat)
          })
        },
        callback
    )
  }

  /**
   * Set the ACL for the node of the given path if such a node exists and the
   * given version matches the version of the node (if the given version is -1,
   * it matches any node's versions).
   *
   *
   * @method setACL
   * @param path {String} The node path.
   * @param acls {Array} The array of ACL objects.
   * @param [version] {Number} The version of the node.
   * @param callback {Function} The callback function.
   */
  setACL (path, acls, version, callback) {
    if (!callback) {
        callback = version
        version = -1
    }

    Path.validate(path)
    assert(typeof callback === 'function', 'callback must be a function.')
    assert(
        Array.isArray(acls) && acls.length > 0,
        'acls must be a non-empty array.'
    )
    assert(typeof version === 'number', 'version must be a number.')

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.SetACLRequest()
    let request

    header.type = jute.OP_CODES.SET_ACL

    payload.path = path
    payload.acl = acls.map(function (item) {
        return item.toRecord()
    })

    payload.version = version;

    request = new jute.Request(header, payload)

    attempt(
      this,
      (attempts, next) => {
        self.connectionManager.queue(request, (error, response) => {
          if (error) return next(error)
          next(null, response.payload.stat)
        })
      },
      callback
    )
  }

  /**
   * Retrieve the ACL list and the stat of the node of the given path.
   *
   * @method getACL
   * @param path {String} The node path.
   * @param callback {Function} The callback function.
   */
  getACL (path, callback) {
    Path.validate(path);
    assert(typeof callback === 'function', 'callback must be a function.');

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.GetACLRequest()
    let request

    header.type = jute.OP_CODES.GET_ACL;

    payload.path = path;
    request = new jute.Request(header, payload);

    attempt(
      this,
      (attempts, next) => {
        this.connectionManager.queue(request, (error, response) => {
          if (error) return next(error)

          let acls;

          if (Array.isArray(response.payload.acl)) {
            acls = response.payload.acl.map(item => ACL.fromRecord(item))
          }

          next(null, acls, response.payload.stat);
        })
      },
      callback
    )
  }

  /**
   * Check the existence of a node. The callback will be invoked with the
   * stat of the given path, or null if node such node exists.
   *
   * If the watcher function is provided and the call is successful (no error
   * from callback), a watcher will be placed on the node with the given path.
   * The watcher will be triggered by a successful operation that creates/delete
   * the node or sets the data on the node.
   *
   * @method exists
   * @param path {String} The node path.
   * @param [watcher] {Function} The watcher function.
   * @param callback {Function} The callback function.
   */
  exists (path, watcher, callback) {
    if (!callback) {
      callback = watcher;
      watcher = undefined;
    }

    Path.validate(path)
    assert(typeof callback === 'function', 'callback must be a function.')

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.ExistsRequest()
    let request

    header.type = jute.OP_CODES.EXISTS

    payload.path = path
    payload.watch = (typeof watcher === 'function')

    request = new jute.Request(header, payload)

    attempt(this,
      (attempts, next) => {
        this.connectionManager.queue(request, (error, response) => {
          if (error && error.getCode() !== Exception.NO_NODE) {
            return next(error)
          }

          let existence = (response.header.err === Exception.OK)

          if (watcher) {
            if (existence) this.connectionManager.registerDataWatcher(path, watcher)
            else this.connectionManager.registerExistenceWatcher(path, watcher)
          }

          next(
            null,
            existence ? response.payload.stat : null
          )
        })
      },
      callback
    )
  }

  /**
   * For the given node path, retrieve the children list and the stat.
   *
   * If the watcher callback is provided and the method completes successfully,
   * a watcher will be placed the given node. The watcher will be triggered
   * when an operation successfully deletes the given node or creates/deletes
   * the child under it.
   *
   * @method getChildren
   * @param path {String} The node path.
   * @param [watcher] {Function} The watcher function.
   * @param callback {Function} The callback function.
   */
  getChildren (path, watcher, callback) {
    if (!callback) {
      callback = watcher
      watcher = undefined
    }

    Path.validate(path);
    assert(typeof callback === 'function', 'callback must be a function.')

    let header = new jute.protocol.RequestHeader()
    let payload = new jute.protocol.GetChildren2Request()
    let request

    header.type = jute.OP_CODES.GET_CHILDREN2;

    payload.path = path;
    payload.watch = (typeof watcher === 'function')

    request = new jute.Request(header, payload)

    attempt(
      this,
      (attempts, next) => {
        this.connectionManager.queue(request, (error, response) => {
          if (error) return next(error)

          if (watcher) {
            this.connectionManager.registerChildWatcher(path, watcher)
          }

          next(null, response.payload.children, response.payload.stat)
        })
      },
      callback
    )
  }

  /**
   * Create node path in the similar way of `mkdir -p`
   *
   *
   * @method mkdirp
   * @param path {String} The node path.
   * @param [data=undefined] {Buffer} The data buffer.
   * @param [acls=ACL.OPEN_ACL_UNSAFE] {Array} The array of ACL object.
   * @param [mode=CreateMode.PERSISTENT] {CreateMode} The creation mode.
   * @param callback {Function} The callback function.
   */
  //mkdirp (path, options) {
  //  let data options.data
  //  let acls = options.acls
  //  let mode = options.mode
  //  let callback = options.callback
  mkdirp (path, data, acls, mode, callback) {
    var optionalArgs = [data, acls, mode, callback],
        self = this,
        currentPath = '',
        nodes;

    Path.validate(path);

    // Reset arguments so we can reassign correct value to them.
    data = acls = mode = callback = undefined;
    optionalArgs.forEach(function (arg, index) {
        if (Array.isArray(arg)) {
            acls = arg;
        } else if (typeof arg === 'number') {
            mode = arg;
        } else if (Buffer.isBuffer(arg)) {
            data = arg;
        } else if (typeof arg === 'function') {
            callback = arg;
        }
    });

    assert(
        typeof callback === 'function',
        'callback must be a function.'
    );

    acls = Array.isArray(acls) ? acls : ACL.OPEN_ACL_UNSAFE;
    mode = typeof mode === 'number' ? mode : CreateMode.PERSISTENT;

    assert(
        data === null || data === undefined || Buffer.isBuffer(data),
        'data must be a valid buffer, null or undefined.'
    );

    if (Buffer.isBuffer(data)) {
        assert(
            data.length <= DATA_SIZE_LIMIT,
            'data must be equal of smaller than ' + DATA_SIZE_LIMIT + ' bytes.'
        );
    }

    assert(acls.length > 0, 'acls must be a non-empty array.');

    // Remove the empty string
    nodes = path.split('/').slice(1);

    async.eachSeries(nodes, function (node, next) {
        currentPath = currentPath + '/' + node;
        self.create(currentPath, data, acls, mode, function (error) {
            // Skip node exist error.
            if (error && error.getCode() === Exception.NODE_EXISTS) {
                next(null);
                return;
            }

            next(error);
        });
    }, function (error) {
        callback(error, currentPath);
    });
  };

  /**
   * Create and return a new Transaction instance.
   *
   * @method transaction
   * @return {Transaction} an instance of Transaction.
   */
  transaction () {
    return new Transaction(this.connectionManager)
  }

}