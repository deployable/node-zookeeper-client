
const events            = require('events')

const Promise           = require('bluebird')
const assert            = require('assert')
const uuid              = require('uuid')
const { defaults, 
      clone, 
      isNumber, 
      isFunction, 
      isNil,
      isBuffer,
      isString,
      isObject,
      isArray }        = require('lodash')

const jute              = require('./jute')
const Path              = require('./Path')
const State             = require('./State')
const Transaction       = require('./Transaction')
const ConnectionManager = require('./ConnectionManager')
const { CLIENT_DEFAULT_OPTIONS, 
      CREATE_MODES,
      DATA_SIZE_LIMIT}  = require('./constants')
const { ACL }           = require('./ACL')

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
      connectionString && isString(connectionString),
      'connectionString must be an non-empty string.'
    )

    assert(
      isObject(options),
      'options must be a valid object'
    )

    this.uid = uuid.v4()
    this.debug = require('debug')(`dply:node-zookeeper-client:Client[${this.uid}]`)
    this.debug('creating Client with options', connectionString, options)
    this.options = defaults(clone(options), CLIENT_DEFAULT_OPTIONS)

    this.state = State.DISCONNECTED

    this.connManager = new ConnectionManager(
      connectionString,
      options,
      this.onConnectionManagerState.bind(this)
    )
    this.conn_mgr = this.connManager
    this.state = this.connManager.state

    this.on('state', State.defaultStateListener)
  }

  /**
   * Start the client and try to connect to the ensemble.
   *
   * @method connect
   */
  connect () {
    return this.connManager.connect()
  }

  waitConnect(){
    return this.connManager.waitConnect() 
  }

  /**
   * Shutdown the client.
   *
   * @method connect
   */
  close () {
    return this.connManager.close()
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
    let state = this.connManager.state
    // Map manager state to client state...
    // connecting = closed
    // failed_auth = closed
    this.state = state
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
    return this.connManager.getSessionId()
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
    return this.connManager.getSessionPassword()
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
    return this.connManager.getSessionTimeout()
  }


  optionsAcls(acls){
    if ( ! isArray(acls) ) acls = ACL.OPEN_ACL_UNSAFE
    if ( acls.length === 0 )
      throw new ZkError('Client "acls" options must be a non-empty array.')
    return acls
  }

  optionsMode(mode){
    return (typeof mode === 'number')
      ? mode
      : CREATE_MODES.PERSISTENT
  }

  optionsData(data){
    if ( !isNil(data) && !isBuffer(data))
      throw new ZkError('Client "data" option must be a valid buffer, null or undefined.')
    if ( isBuffer(data) && data.length > DATA_SIZE_LIMIT )
      throw new ZkError(`Client "data" option must be equal or smaller than ${DATA_SIZE_LIMIT} bytes.`)
  }

  optionsCallback(callback){
    if ( callback && !isFunction(callback) )
      throw new ZkError('Client callback option must be a function.')
    return callback
  }

  optionsVersion( version = -1 ){
    if ( !isNumber(version) ) 
      throw new ZkError('Client version must be a number')
    return version 
  }

  optionsWatcher( watcher ){
    if ( watcher && !isFunction(callback) )
      throw new ZkError('Client watcher option must be a function.')
    return watcher
  }

  /**
   * Add the specified scheme:auth information to this client.
   *
   * @method addAuthInfo
   * @param scheme {String} The authentication scheme.
   * @param auth {Buffer} The authentication data buffer.
   */
  addAuthInfo (scheme, auth) {
    if ( !isString(scheme) || isEmpty(scheme) )
      throw new ZkError('Client scheme must be a non-empty string.')

    if ( ! isBuffer(auth) )
      throw new ZkError('auth info must be a valid instance of Buffer')

    let buffer = new Buffer(auth.length)

    auth.copy(buffer)
    return this.connManager.addAuthInfo(scheme, buffer)
  }

  /**
   * Create a node with given path, data, acls and mode.
   *
   * @method create
   * @param xkpath {String} The zk node path.
   * @param options { Object }
   *    [data=undefined] {Buffer} The data buffer.
   *    [acls=ACL.OPEN_ACL_UNSAFE] {Array} An array of ACL object.
   *    [mode=CREATE_MODES.PERSISTENT] {CREATE_MODES} The creation mode.
   *    callback {Function} The callback function.
   */
  create ( zkpath, options = {} ) {
    return new Promise((resolve) => {
      // Arguments/Options 
      Path.validate(zkpath)
      let acls = this.optionsAcls(options.acls)
      let mode = this.optionsMode(options.mode)
      let data = this.optionsData(options.data)

      // Request
      let header = jute.protocol.RequestHeader.type('CREATE')

      let payload = new jute.protocol.CreateRequest()
      payload.path = zkpath
      payload.acl = acls.map(item => item.toRecord())
      payload.flags = mode

      if (Buffer.isBuffer(data)) {
        payload.data = new Buffer(data.length)
        data.copy(payload.data)
      }

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => response.payload.path)
      ))
    })
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
  remove ( zkpath, options = {} ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let version = this.optionsVersion(options.version)

      let header = jute.protocol.RequestHeader.type('DELETE')

      let payload = new jute.protocol.DeleteRequest()
      payload.path = zkpath
      payload.version = version

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(this.connManager.queue(request)))
    })
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
  setData ( zkpath, options = {} ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let data = this.optionsData(options.data)
      let version = this.optionsVersion(options.version)

      let header = jute.protocol.RequestHeader.type('SET_DATA')

      let payload = new jute.protocol.SetDataRequest()
      payload.path = zkpath
      payload.data = new Buffer(data.length)
      data.copy(payload.data)
      payload.version = version

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => response.payload.stat)
      ))
    })
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
  getData ( zkpath, options = {} ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let header = jute.protocol.RequestHeader.type('GET_DATA')

      let payload = new jute.protocol.GetDataRequest()
      payload.path = zkpath
      payload.watch = Boolean(watcher)

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => {
          if (watcher) this.connManager.registerDataWatcher(path, watcher)
          return response.payload
        })
      ))
    })
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
  setACL( zkpath, options = {} ){
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let acls = this.optionsAcls(options.acls)
      let version = this.optionsWatcher(options.version)

      let header = jute.protocol.RequestHeader.type('SET_ACL')
      let payload = new jute.protocol.SetACLRequest().addACLArray(acls)
      payload.path = zkpath
      payload.version = version

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(res => res.payload.stat)
      ))
    })
  }

  /**
   * Retrieve the ACL list and the stat of the node of the given path.
   *
   * @method getACL
   * @param path {String} The node path.
   * @param callback {Function} The callback function.
   */
  getACL ( zkpath ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)

      let header = jute.protocol.RequestHeader.type('GET_ACL')

      let payload = new jute.protocol.GetACLRequest()
      payload.path = zkpath
      
      let request = new jute.Request(header, payload);

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => {
          let acls
          if ( isArray(response.payload.acl) ) {
            acls = response.payload.acl.map(item => ACL.fromRecord(item))
          }
          return { acls: acls, stat: response.payload.stat}        
        })
      ))
    })
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
  exists ( zkpath, options = {} ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let header = jute.protocol.RequestHeader.type('EXISTS')

      let payload = new jute.protocol.ExistsRequest()
      payload.path = zkpath
      payload.watch = Boolean(watcher)

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response =>{
          let existence = (response.header.err === Exception.OK)
          if (watcher) {
            if (existence) this.connManager.registerDataWatcher(path, watcher)
            else this.connManager.registerExistenceWatcher(path, watcher)
          }
          return existence ? response.payload.stat : null
        })
        .catch(error => {
          if ( error.getCode() !== Exception.NO_NODE) throw error
          return null
        })
      ))
    })
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
  getChildren( zkpath, options = {} ){
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let header = jute.protocol.RequestHeader.type('GET_CHILDREN2')

      let payload = new jute.protocol.GetChildren2Request()
      payload.path = zkpath
      payload.watch = Boolean(watcher)

      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => {
          watcher && this.connManager.registerChildWatcher(zkpath, watcher)
          let result = { 
            children: response.payload.children,
            stat: response.payload.stat
          }
          return result
        })
      ))
    })
  }

  /**
   * Create node path in the similar way of `mkdir -p`
   *
   *
   * @method mkdirp
   * @param path {String} The node path.
   * @param [data=undefined] {Buffer} The data buffer.
   * @param [acls=ACL.OPEN_ACL_UNSAFE] {Array} The array of ACL object.
   * @param [mode=CREATE_MODES.PERSISTENT] {CREATE_MODES} The creation mode.
   * @param callback {Function} The callback function.
   */
  //mkdirp (path, options) {
  //  let data options.data
  //  let acls = options.acls
  //  let mode = options.mode
  //  let callback = options.callback
  mkdirp ( zkpath,  options = {} ) {
    return new Promise((resolve) => {
      Path.validate(zkpath)
      let acls = this.optionsAcls(options.acls)
      let mode = this.optionsMode(options.mode)
      let data = this.optionsData(options.data)

      // Remove the empty string
      let nodes = path.split('/').slice(1)
      let currentPath = '' // Can probably do this without the var

      let result = Promise.each(nodes, node => {
          currentPath = `${currentPath}/${node}`
          return this.create(currentPath, { data: data, acls: acls, mode: mode })
            .catch(error => {
              if ( error.getCode() === Exception.NODE_EXISTS ) return true
              throw error
            })
        })
      return resolve(result)
    })
  }

  /**
   * Create and return a new Transaction instance.
   *
   * @method transaction
   * @return {Transaction} an instance of Transaction.
   */
  transaction () {
    return new Transaction(this.connManager)
  }

}