/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const net = require('net')
const events = require('events')

const Promise = require('bluebird')
const uuid = require('uuid')
const { isObject, isNumber, get } = require('lodash')

const jute = require('./jute')
const {ConnectionStringParser} = require('./ConnectionStringParser')
const WatcherManager = require('./WatcherManager')
const PacketQueue = require('./PacketQueue')
const {Exception} = require('./Exception')
const {ZkError} = require('./errors')

/**
 * This class manages the connection between the client and the ensemble.
 *
 * @module node-zookeeper-client
 */

 // Connection Manager States.
const STATE = { 
  CONNECTING: 1,
  ASSOCIATING: 2,
  CONNECTED: 3,
  CONNECTED_READ_ONLY: 5,
  EXPIRED_SESSION: -112,
  AUTH_FAILED: -113,
  CLOSED: -1,

// Internal States
  CLOSING: -2,
  DISCONNECTED: -5,
}


/**
 * Construct a new ConnectionManager instance.
 *
 * @class ConnectionStringParser
 * @constructor
 * @param connectionString {String} ZooKeeper server ensemble string.
 * @param options {Object} Client options.
 * @param stateListener {Object} Listener for state changes.
 */

class ConnectionManager extends events.EventEmitter {

  static init(){
    this.STATE = STATE
  }

  constructor (connectionString, options = {}, stateListener) {
    super()

    this.uid = uuid.v4()
    this.debug = require('debug')(`dply:node-zookeeper-client:ConnectionManager[${this.uid}]`)
    this.debug('creating ConnectionManager with options', connectionString, options)
    this.logger = options.logger || console || { 
      error: ()=> undefined,
      warn: ()=> undefined,
      info: ()=> undefined, 
      debug: ()=> undefined
    }

    this.watcherManager = new WatcherManager()
    this.connectionStringParser = new ConnectionStringParser(connectionString)

    this.servers = this.connectionStringParser.getServers()
    this.chrootPath = this.connectionStringParser.getChrootPath()
    this.nextServerIndex = 0
    this.serverAttempts = 0

    this.state = STATE.DISCONNECTED

    this.options = options
    this.spinDelay = options.spinDelay || 200

    this.updateTimeout(options.sessionTimeout || 30000 )
    this.connectTimeoutHandler = null

    this.xid = 0

    this.sessionId = new Buffer(8)
    if (Buffer.isBuffer(options.sessionId)) {
      options.sessionId.copy(this.sessionId)
    } else {
      this.sessionId.fill(0)
    }

    this.sessionPassword = new Buffer(16)
    if (Buffer.isBuffer(options.sessionPassword)) {
      options.sessionPassword.copy(this.sessionPassword)
    } else {
      this.sessionPassword.fill(0)
    }

    // scheme:auth pairs
    this.credentials = []

    // Last seen zxid.
    this.zxid = new jute.types.JuteTypeLong()

    this.pendingBuffer = null

    this.packetQueue = new PacketQueue()
    this.packetQueue.on('readable', this.onPacketQueueReadable.bind(this))
    this.pendingQueue = []

    this.on('state', stateListener)
  }

  // Attempt to run a promise multiple times on error
  attempt(fn){
    return new Promise(resolve=> {
      // Fixme, add the retry logic back in
      resolve(fn)
    })
  }

  /**
   * Update the session timeout and related timeout variables.
   *
   * @method updateTimeout
   * @private
   * @param sessionTimeout {Number} Milliseconds of the timeout value.
   */
  updateTimeout(sessionTimeout){
    this.sessionTimeout = sessionTimeout

    // Designed to have time to try all the servers.
    this.connectTimeout = Math.floor(sessionTimeout / this.servers.length)

    // We at least send out one ping one third of the session timeout, so
    // the read timeout is two third of the session timeout.
    this.pingTimeout = Math.floor(this.sessionTimeout / 3)
    // this.readTimeout = Math.floor(sessionTimeout * 2 / 3)
  }

  /**
   * Find the next available server to connect. If all server has been tried,
   * it will wait for a random time between 0 to spin delay before call back
   * with the next server.
   *
   * callback prototype:
   * callback(server);
   *
   * @method findNextServer
   * @param callback {Function} callback function.
   *
   */
  findNextServer () {
    return new Promise(resolve => {
      this.nextServerIndex %= this.servers.length

      // If all server have been tried, delay a bit before
      // resolving the same one again
      if (this.serverAttempts === this.servers.length) {
        let delayms = Math.random() * this.spinDelay
        return resolve(Promise.delay(delayms).then(()=> {
          this.nextServerIndex += 1
          this.serverAttempts = 0
          return this.servers[this.nextServerIndex]
        }))
      }

      this.serverAttempts += 1
      resolve(this.servers[this.nextServerIndex])
      this.nextServerIndex += 1
    })
  }

  /**
   * Change the current state to the given state if the given state is different
   * from current state. Emit the state change event with the changed state.
   *
   * @method setState
   * @param state {Number} The state to be set.
   */
  setState(state) {
    if ( ! isNumber(state) )
      throw new Error('state must be a valid number.')

    if (this.state !== state) {
      this.state = state
      this.debug('setState', state)
      this.emit('state', this.state)
    }
  }

  registerDataWatcher(path, watcher) {
    this.watcherManager.registerDataWatcher(path, watcher)
  }

  registerChildWatcher(path, watcher) {
    this.watcherManager.registerChildWatcher(path, watcher)
  }

  registerExistenceWatcher(path, watcher) {
    this.watcherManager.registerExistenceWatcher(path, watcher)
  }

  cleanupPendingQueue(errorCode) {
    let pending_pkt 
    while (pending_pkt = this.pendingQueue.shift()) {
      this.debug('pending packet dropped', errorCode, pending_pkt.request.header)
      if (pending_pkt.reject) {
        pending_pkt.reject(Exception.create(errorCode))
      }
      else {
        this.logger.error('Pending packet cleaned', errorCode, pending_pkt)
      }
    }
  }

  getSessionId() {
    let result = new Buffer(8)
    this.sessionId.copy(result)
    return result
  }

  getSessionPassword() {
    let result = new Buffer(16)
    this.sessionPassword.copy(result)
    return result
  }

  getSessionTimeout() {
    return this.sessionTimeout
  }

  // Resolves when a zookeeper server responds
  connect() {
    return new Promise((resolve, reject) => {
      if ( this.socket && this.state === STATE.CONNECTED )
        return resolve(true)

      if ( this.socket && this.state === STATE.CONNECTING )
        return reject(new ZkError('Already connecting'))

      this.setState(STATE.CONNECTING)

      this.findNextServer()
      .then(server => {
        this.debug('connecting to server', server)
        this.socket = net.connect(server, ()=>{
          this.debug('connected socket to server', server)
          resolve(this.onSocketConnected())
        })

        // Disable the Nagle algorithm.
        this.socket.setNoDelay()

        //this.socket.on('connect', this.onSocketConnected.bind(this))
        this.socket.on('data',    this.onSocketData.bind(this))
        this.socket.on('drain',   this.onSocketDrain.bind(this))
        this.socket.on('close',   this.onSocketClosed.bind(this))
        this.socket.on('error',   this.onSocketError.bind(this))
      })
    })
    .timeout(this.connectTimeout)
    .catch(Promise.TimeoutError, err => {
      this.debug('connection timed out', err)
      this.onSocketConnectTimeout()
    })
  }

  // Resolves when the zookeeper connection state is CONNECTED
  waitConnect(){
    return new Promise((resolve, reject) => {
      if (this.state !== STATE.DISCONNECTED || this.state !== STATE.CONNECTING)
        return reject(new Error('already disconnected'))
      this.once('state', state => {
        return (state === STATE.CONNECTED) ? resolve(true) : reject(false)
      })
      this.connect()
    })
  }

  close(){
    return new Promise((resolve) => {
      switch(this.state){
        case STATE.CLOSING:
        case STATE.CLOSED:
        case STATE.DISCONNECTED:
        case STATE.AUTH_FAILED:
        case STATE.SESSION_EXPIRED:
          return resolve(true)

        case STATE.CONNECTING:
          this.debug('Still connecting, close is being queued')
      }

      let header = jute.protocol.RequestHeader.type('CLOSE_SESSION')
      let request = new jute.Request(header, null)
      this.setState(STATE.CLOSING)

      return resolve(this.queue(request))
    })
  }

  waitClose(){

  }

  onSocketClosed(error) {
    let retry = false
    let errorCode = null

    switch (this.state) {
    
      case STATE.CLOSING:
          errorCode = Exception.CONNECTION_LOSS
          retry = false
          break
    
      case STATE.SESSION_EXPIRED:
          errorCode = Exception.SESSION_EXPIRED
          retry = false
          break
      
      case STATE.AUTH_FAILED:
          errorCode = Exception.AUTH_FAILED
          retry = false
          break

      default:
          errorCode = Exception.CONNECTION_LOSS
          this.debug('error was set to CONNECTION_LOSS but was', error)
          retry = true
    }

    this.cleanupPendingQueue(errorCode)
    this.setState(STATE.DISCONNECTED)

    if (retry) this.connect()
    else this.setState(STATE.CLOSED)

  };

  
  // After socket error, the socket closed event will be triggered,
  // we will retry connect in that listener function.
  onSocketError(error) {
    this.debug('onSocketError', error)
    if (this.connectTimeoutHandler) clearTimeout(this.connectTimeoutHandler)
  }


  // Destroy the current socket so the socket closed event
  // will be trigger.
  onSocketConnectTimeout() {
    this.socket.destroy()
  }

  onSocketConnected() {
    return new Promise((resolve, reject) => {
      this.debug('onSocketConnected')

      if (this.connectTimeoutHandler) clearTimeout(this.connectTimeoutHandler)

      let connectRequest = new jute.Request(null, new jute.protocol.ConnectRequest(
        jute.PROTOCOL_VERSION,
        this.zxid,
        this.sessionTimeout,
        this.sessionId,
        this.sessionPassword
      ))

      // XXX No read only support yet.
      let p = null
      this.socket.write(connectRequest.toBuffer())

      // Set auth info
      if (this.credentials.length > 0) {
        this.credentials.forEach(credential => {
          let header = jute.protocol.RequestHeader.type('AUTH')
          header.xid = jute.XID_AUTHENTICATION
          let payload = new jute.protocol.AuthPacket(0, credential.scheme, credential.auth)
          let authRequest = new jute.Request(header, payload)
          p = this.queue(authRequest)
        })
      }

      // Reset the watchers if we have any.
      if (!this.watcherManager.isEmpty()) {

        let header = jute.protocol.RequestHeader.type('XID_SET_WATCHES')
        header.type = jute.OP_CODES.SET_WATCHES

        let payload = new jute.protocol.SetWatches()
        payload.setChrootPath(this.chrootPath)
        payload.relativeZxid = this.zxid
        payload.dataWatches = this.watcherManager.getDataWatcherPaths()
        payload.existWatches = this.watcherManager.getExistenceWatcherPaths()
        payload.childWatches = this.watcherManager.getChildWatcherPaths()

        let setWatchesRequest = new jute.Request(header, payload)
        p = this.queue(setWatchesRequest)
      }

      if (p) {
        // If we have packet queued use that promise
        // for resolving "conected" 
        resolve(p)
      } else {
        // Otherwise we need to push this promise 
        // onto the other side of an event emitter
        // by attaching `resolve`/`reject` to the class
        // for later use. 
        this.connectPromiseResolve = resolve
        this.connectPromiseReject = reject
      }
    })
  }


  onSocketTimeout() {
    let header, request

    if (!this.socket) return this.debug('onSocketTimeout - no socket')
    if (this.state === STATE.CONNECTED ||
        this.state === STATE.CONNECTED_READ_ONLY) {

      header = new jute.protocol.RequestHeader(
        jute.XID_PING,
        jute.OP_CODES.PING
      )

      request = new jute.Request(header, null)
      this.queue(request)

      // Re-register the timeout handler since it only fired once.
      this.socket.setTimeout(
        this.pingTimeout,
        this.onSocketTimeout.bind(this)
      )
    }
  }

  onSocketData(buffer) {
    this.debug('onSocketData', buffer)
    let offset = 0
    let size = 0
    let connectResponse,
      pending_pkt,
      responsePayload,
//    response,
      event

    // Combine the pending buffer with the new buffer.
    if (this.pendingBuffer) {
      let new_length = this.pendingBuffer.length + buffer.length
      buffer = Buffer.concat( [this.pendingBuffer, buffer], new_length )
    }

    // We need at least 4 bytes
    if (buffer.length < 4) {
      this.pendingBuffer = buffer
      return
    }

    size = buffer.readInt32BE(offset)
    offset += 4

    if (buffer.length < size + 4) {
      // More data are coming.
      this.pendingBuffer = buffer
      return
    }

    if (buffer.length === size + 4) {
      // The size is perfect.
      this.pendingBuffer = null
    } else {
      // We have extra bytes, splice them out as pending buffer.
      this.pendingBuffer = buffer.slice(size + 4)
      buffer = buffer.slice(0, size + 4)
    }

    if (this.state === STATE.CONNECTING) {

      // Handle connect response.
      this.debug('onSocketData connection response')

      connectResponse = new jute.protocol.ConnectResponse()
      offset += connectResponse.deserialize(buffer, offset)

      if (connectResponse.timeOut <= 0) {
        this.setState(STATE.SESSION_EXPIRED)
        if (this.connectPromiseReject) {
          let reject = this.connectPromiseReject
          this.connectPromiseReject = null
          return reject(new ZkError('Session expired'))
        }
      }

      // Reset the server connection attempts since we connected now.
      this.serverAttempts = 0

      this.sessionId = connectResponse.sessionId.value
      this.sessionPassword = connectResponse.passwd.value
      this.updateTimeout(connectResponse.timeOut.value)

      this.setState(STATE.CONNECTED)

      // Check if we have anything to send out just in case.
      this.onPacketQueueReadable()

      this.socket.setTimeout(
        this.pingTimeout,
        this.onSocketTimeout.bind(this)
      )

      if (this.connectPromiseResolve) {
        let resolve = this.connectPromiseResolve
        this.connectPromiseResolve = null
        return resolve(true)
      }
      return
    }

    if (this.state === STATE.CLOSING) {

      // Check the close response xid and then happily close
      let reply_header = new jute.protocol.ReplyHeader()
      offset += reply_header.deserialize(buffer, offset)
      pending_pkt = this.pendingQueue.shift()
      this.debug('got reply header', reply_header.xid.value, pending_pkt.request.header)

      // Check the server response to the close
      if ( ! pending_pkt.request.header.isType('CLOSE_SESSION') ) {
        let errmsg = 'Closing session but the next packet in the queue is not a close reply'
        this.logger.error(errmsg)
        if (pending_pkt.reject) 
          pending_pkt.reject(new ZkError(errmsg))
      }

      // If we have the pending close packet, resolve it's promise
      if (pending_pkt.resolve) pending_pkt.resolve(true)

      // All done
      if (this.socket) this.socket.destroy()
      return
    }

    // Handle  all other responses.
    let response_header = new jute.protocol.ReplyHeader()
    offset += response_header.deserialize(buffer, offset)

    // TODO BETTTER LOGGING
    switch (response_header.xid) {
    
      case jute.XID_PING:
        this.debug('onSocketData: got ping from server(xid)')
        break
      
      case jute.XID_AUTHENTICATION:
        this.debug('onSocketData: got auth from server(xid)')
        if (response_header.err === Exception.AUTH_FAILED) {
          this.logger.error('Authentication failed')
          this.setState(STATE.AUTHENTICATION_FAILED)
        }
        break

      case jute.XID_NOTIFICATION:
        this.debug('onSocketData: got watcher notification from server(xid)')
        event = new jute.protocol.WatcherEvent()

        if (this.chrootPath) event.setChrootPath(this.chrootPath)

        offset += event.deserialize(buffer, offset)
        this.watcherManager.emit(event)
        break
      
    }

    this.debug('onSocketData: got standard packet')
    pending_pkt = this.pendingQueue.shift()
    let request_header = pending_pkt.request.header

    if (!pending_pkt) {
      this.logger.error('Nothing in pending queue but got data from server', response_header)
      this.logger.error('Destroying socket')
      this.socket.destroy() // this will trigger reconnect
      return
    }

    let request_xid = request_header.getXid()
    let response_xid = response_header.getXid()

    if ( request_xid !== response_xid ){
      let errmsg = `Xid out of order. Got xid "${response_xid}" wanted "${request_xid}"`
      this.logger.error(errmsg)
      this.logger.error('Destroying socket')
      if ( pending_pkt.reject ) pending_pkt.reject(new ZkError(errmsg))
      this.socket.destroy() // this will trigger reconnect
      return
    }

    if ( response_header.zxid ) {
      this.debug('zxid before: %d%d  now: %d%d', this.zxid.high, this.zxid.low, response_header.zxid.high, response_header.zxid.low)

      // Sanity check on the ZXid we are expecting
      if ( ! response_header.zxid.isEqualToOrGreaterThan(this.zxid) ) {
        let errmsg = `ZXid from server out of order! ${this.zxid.high}${this.zxid.low} - ${response_header.zxid.high}${response_header.zxid.low}`
        this.logger.error(errmsg)
        if ( pending_pkt.reject ) pending_pkt.reject(new ZkError(errmsg))
        this.socket.destroy() // this will trigger reconnect
        return
      }

      this.zxid = response_header.zxid
    }

    if (response_header.err.value !== 0) {
      let err = Exception.create(response_header.err.value)
      err.response = new jute.Response(response_header, null)
      if (pending_pkt.reject) {
        pending_pkt.reject(err)
      } else {
        this.logger.error('Response error', err)
      }
      return
    }

    switch ( get(pending_pkt, 'request.header.type.value') ) {
    case jute.OP_CODES.CREATE:
        responsePayload = new jute.protocol.CreateResponse()
        break
    case jute.OP_CODES.DELETE:
        responsePayload = null
        break
    case jute.OP_CODES.GET_CHILDREN2:
        responsePayload = new jute.protocol.GetChildren2Response()
        break
    case jute.OP_CODES.EXISTS:
        responsePayload = new jute.protocol.ExistsResponse()
        break
    case jute.OP_CODES.SET_DATA:
        responsePayload = new jute.protocol.SetDataResponse()
        break
    case jute.OP_CODES.GET_DATA:
        responsePayload = new jute.protocol.GetDataResponse()
        break
    case jute.OP_CODES.SET_ACL:
        responsePayload = new jute.protocol.SetACLResponse()
        break
    case jute.OP_CODES.GET_ACL:
        responsePayload = new jute.protocol.GetACLResponse()
        break
    case jute.OP_CODES.SET_WATCHES:
        responsePayload = null
        break
    case jute.OP_CODES.CLOSE_SESSION:
        responsePayload = null
        break
    case jute.OP_CODES.MULTI:
        responsePayload = new jute.TransactionResponse()
        break
    default:
        this.logger.error('Unknown request OP_CODE: %s',
          get(pending_pkt, 'request.header.type.value') )
        this.logger.error('destroying socket')
        this.socket.destroy() // this will trigger reconnect
        return
    }

    if (responsePayload) {
      if (this.chrootPath) responsePayload.setChrootPath(this.chrootPath)
      offset += responsePayload.deserialize(buffer, offset)
    }

    if (pending_pkt.resolve) {
      this.debug('resolving pending packet with new response')
      pending_pkt.resolve( new jute.Response(response_header, responsePayload))
    }


    // We have more data to process, need to recursively process it.
    if (this.pendingBuffer) this.onSocketData(new Buffer(0))
  }

  // Trigger write on socket.
  onSocketDrain() {
    this.onPacketQueueReadable()
  }

  onPacketQueueReadable() {
    switch (this.state) {

      // Continue
      case STATE.CONNECTED:
      case STATE.CONNECTED_READ_ONLY:
      case STATE.CLOSING:
      case STATE.CONNECTING:
          this.debug('onPacketQueueReadable state *connected', this.state)
          break

      // Skip since we can not send traffic out
      case STATE.DISCONNECTED:
      case STATE.CLOSED:
      case STATE.SESSION_EXPIRED:
      case STATE.AUTHENTICATION_FAILED:
          this.debug('onPacketQueueReadable state *disconnected', this.state)
          return

      default:
          throw new ZkError(`Can't read packet queue in unknown state "${this.state}"`)
    }

    let packet
    while ( (packet = this.packetQueue.shift()) !== undefined ) {
      let header = packet.request.header
      if (header !== null &&
        header.type !== jute.OP_CODES.PING &&
        header.type !== jute.OP_CODES.AUTH) {

        header.xid = this.xid
        this.xid += 1

        // Only put requests that are not connect, ping and auth into
        // the pending queue.
        this.pendingQueue.push(packet)
      }

      if (!this.socket) {
        this.logger.error('onPacketQueueReadable: No socket available, Disconnected')
        this.setState(STATE.DISCONNECTED)
        break 
      }

      let buf = packet.request.toBuffer()
      this.debug('onPacketQueueReadable: writing to socket', packet.request.header)
      this.debug('onPacketQueueReadable:', buf)
      if ( ! this.socket.write(buf) ) {
        // Back pressure is handled here, when the socket emit
        // drain event, this method will be invoked again.
        this.debug('onPacketQueueReadable: buffer not written to socket', buf)
        this.packetQueue.unshift(packet)
        break
      }

      if (header.type === jute.OP_CODES.CLOSE_SESSION) {
        // The close session should be the final packet sent to the
        // server.
        break
      }
    }
  }

  addAuthInfo(scheme, auth) {
    if (!scheme || typeof scheme !== 'string') {
      throw new Error('scheme must be a non-empty string.')
    }

    if (!Buffer.isBuffer(auth)) {
      throw new Error('auth must be a valid instance of Buffer')
    }

    let header, payload

    this.credentials.push({
      scheme: scheme,
      auth: auth
    })

    switch (this.state) {
      case STATE.CONNECTED:
      case STATE.CONNECTED_READ_ONLY:
          // Only queue the auth request when connected.
          header = new jute.protocol.RequestHeader()
          payload = new jute.protocol.AuthPacket()

          header.xid = jute.XID_AUTHENTICATION
          header.type = jute.OP_CODES.AUTH

          payload.type = 0
          payload.scheme = scheme
          payload.auth = auth

          this.queue(new jute.Request(header, payload))
          break

      case STATE.DISCONNECTED:
      case STATE.CONNECTING:
      case STATE.CLOSING:
      case STATE.CLOSED:
      case STATE.SESSION_EXPIRED:
      case STATE.AUTHENTICATION_FAILED:
          // Skip when we are not in a live state.
          return

      default:
          throw new Error(`Unknown state: ${this.state}`)
    }
  }

  queue(request) {
    return new Promise((resolve, reject)=>{

      if ( ! isObject(request) )
        return reject( new Error('request must be a valid instance of jute.Request.') )

      if (this.chrootPath && request.payload)
        request.payload.setChrootPath(this.chrootPath)

      switch (this.state) {

        case STATE.DISCONNECTED:
        case STATE.CONNECTING:
        case STATE.CONNECTED:
        case STATE.CONNECTED_READ_ONLY:
            // queue the packet, attach promise
            return this.packetQueue.push({
              request: request,
              resolve: resolve,
              reject: reject
            })

        case STATE.CLOSING:
            this.debug('request', request)
            if (request.header && request.header.isType('CLOSE_SESSION')) {
              return this.packetQueue.push({
                request: request,
                resolve: resolve,
                reject: reject
              })
            }
            return reject(Exception.create(Exception.CONNECTION_LOSS))

        case STATE.CLOSED:
            return reject(Exception.create(Exception.CONNECTION_LOSS))

        case STATE.SESSION_EXPIRED:
            return reject(Exception.create(Exception.SESSION_EXPIRED))

        case STATE.AUTHENTICATION_FAILED:
            return reject(Exception.create(Exception.AUTH_FAILED))

        default:
            return reject(new ZkError(`Can't queue in unknown state "${this.state}"`))
        }
    })
  }

}
ConnectionManager.init()

module.exports = ConnectionManager
