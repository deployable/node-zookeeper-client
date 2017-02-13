
const events            = require('events')

const Promise           = require('bluebird')
const assert            = require('assert')
const uuid              = require('uuid')
const {clone,
      defaults, 
      isArray,
      isBuffer,
      isFunction, 
      isNil,
      isNumber, 
      isObject,
      isString,}        = require('lodash')

const { ACL }           = require('./ACL')
const ConnectionManager = require('./ConnectionManager')
const {CLIENT_DEFAULT_OPTIONS, 
      CREATE_MODES,
      DATA_SIZE_LIMIT}  = require('./constants')
const {ZkError,ZkException} = require('./errors')
const jute              = require('./jute')
const {Validate}        = require('./Validate')
const State             = require('./State')
const Transaction       = require('./Transaction')

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

    if ( !isString(connectionString) )
      throw new ZkError('Client connectionString must be a string')

    if ( !isObject(options) )
      throw new ZkError('Client options must be a valid object')

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
      throw new ZkError('Client "acls" option must be a non-empty array.')
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
    return data
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
  addAuthInfo(scheme, auth){
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
  create( zkpath, options = {} ){
    return new Promise((resolve) => {
      // Arguments/Options 
      Validate.path(zkpath)
      let acls = this.optionsAcls(options.acls)
      let mode = this.optionsMode(options.mode)
      let data = this.optionsData(options.data)

      let acl = acls.map(item => item.toRecord())
      let request = jute.Request.CreateRequest(zkpath, data, acl, mode)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => response.payload.path.value)
      ))
    })
  }

  /**
   * Delete a node with the given path. If version is not -1, the request will
   * fail when the provided version does not match the server version.
   *
   * @method delete
   * @param path {String} The node path.
   * @param options {Object}
   *   [version=-1] {Number} The version of the node.
   */
  remove( zkpath, options = {} ){
    return new Promise((resolve) => {
      Validate.path(zkpath)
      let version = this.optionsVersion(options.version)

      let request = jute.Request.DeleteRequest(zkpath, version)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(()=> true)
      ))
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
   * @param options {Object}
   *   [version=-1] {Number} The version of the node.
   */
  setData ( zkpath, data_opt, options = {} ) {
    return new Promise((resolve) => {
      Validate.path(zkpath)
      let data = this.optionsData(data_opt)
      let version = this.optionsVersion(options.version)

      let request = new jute.Request.SetDataRequest(zkpath, data, version)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => response.payload.stat.toJS())
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
      Validate.path(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let request = jute.Request.GetDataRequest(zkpath, watcher)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response => {
          if (watcher) this.connManager.registerDataWatcher(path, watcher)
          return { 
            data: response.payload.data.value,
            stat: response.payload.stat.toJS()
          }
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
   * @param options {Object}
   *    [version] {Number} The version of the node.
   */
  setACL( zkpath, acls, options = {} ){
    return new Promise((resolve) => {
      Validate.path(zkpath)
      
      if ( ! isArray(acls) || acls.length === 0 )
        throw new ZkError('Client "acls" option must be a non-empty array.')

      let version = this.optionsWatcher(options.version)

      let request = new jute.Request.SetACLRequest(zkpath, undefined, version)
      request.payload.addACLArray(acls)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(res => res.payload.stat.toJS())
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
      Validate.path(zkpath)

      let request = new jute.Request.GetACLRequest(zkpath)

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
  exists( zkpath, options = {} ){
    return new Promise((resolve) => {
      Validate.path(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let header = jute.protocol.RequestHeader.type('EXISTS')
      let payload = new jute.protocol.ExistsRequest(zkpath, watcher)
      let request = new jute.Request(header, payload)

      return resolve(this.connManager.attempt(
        this.connManager.queue(request).then(response =>{
          this.debug('exists', response.header.err.value)
          let existence = (response.header.err.value === ZkException.OK)
          if (watcher) {
            if (existence) this.connManager.registerDataWatcher(path, watcher)
            else this.connManager.registerExistenceWatcher(path, watcher)
          }
          return existence ? response.payload.stat.toJS() : null
        })
        .catch(error => {
          if ( error.checkCode && error.checkCode('NO_NODE')) return null
          throw error
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
      Validate.path(zkpath)
      let watcher = this.optionsWatcher(options.watcher)

      let header = jute.protocol.RequestHeader.type('GET_CHILDREN2')
      let payload = new jute.protocol.GetChildren2Request(zkpath, watcher)
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
      Validate.path(zkpath)
      let acls = this.optionsAcls(options.acls)
      let mode = this.optionsMode(options.mode)
      let data = this.optionsData(options.data)

      // Remove the empty string
      let nodes = zkpath.split('/').slice(1)
      let currentPath = '' // Can probably do this without the var

      let result = Promise.each(nodes, node => {
          currentPath = `${currentPath}/${node}`
          return this.create(currentPath, { data: data, acls: acls, mode: mode })
            .catch(error => {
              if ( error.checkCode && error.checkCode('NODE_EXISTS') ) return currentPath
              throw error
            })
        })
        .then(results => {
          this.debug('mkdirp results', results)
          return '/' + results.join('/')
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
