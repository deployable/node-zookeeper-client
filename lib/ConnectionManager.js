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
const { isObject, isNumber } = require('lodash')

const jute = require('./jute')
const {ConnectionStringParser} = require('./ConnectionStringParser')
const WatcherManager = require('./WatcherManager')
const PacketQueue = require('./PacketQueue')
const {Exception} = require('./Exception')

/**
 * This class manages the connection between the client and the ensemble.
 *
 * @module node-zookeeper-client
 */

 // Connection Manager States.
const STATES = { 
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
    this.STATES = STATES
  }

  constructor (connectionString, options = {}, stateListener) {
    super()

    this.uid = uuid.v4()
    this.debug = require('debug')(`dply:node-zookeeper-client:ConnectionManager[${this.uid}]`)
    this.debug('creating ConnectionManager with options', connectionString, options)

    this.watcherManager = new WatcherManager()
    this.connectionStringParser = new ConnectionStringParser(connectionString)

    this.servers = this.connectionStringParser.getServers()
    this.chrootPath = this.connectionStringParser.getChrootPath()
    this.nextServerIndex = 0
    this.serverAttempts = 0

    this.state = STATES.DISCONNECTED

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
    this.zxid = new Buffer(8)
    this.zxid.fill(0)

    this.pendingBuffer = null

    this.packetQueue = new PacketQueue()
    this.packetQueue.on('readable', this.onPacketQueueReadable.bind(this))
    this.pendingQueue = []

    this.on('state', stateListener)
  }

  // Attempt to run a promise multiple times on error
  attempt(fn){
    return new Promise((resolve, reject)=> {
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
    let pendingPacket 
    while (pendingPacket = this.pendingQueue.shift()) {
      if (pendingPacket.reject) pendingPacket.reject(Exception.create(errorCode))
      else debug('pending packet dropped', errorCode, pendingPacket)
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

  // Resolves when the tcp connection is made
  connect() {
    return new Promise((resolve, reject) => {
      if ( this.socket && this.state === STATES.CONNECTED ) return resolve(true)
      if ( this.socket && this.state === STATES.CONNECTING ) return reject(new ZkError('Already connecting'))
      this.setState(STATES.CONNECTING)

      this.findNextServer()
      .then(server => {
        this.debug('connecting to server', server)
        this.socket = net.connect(server, ()=>{
          this.debug('connected to server', server)
          resolve(true)
        })

        // Disable the Nagle algorithm.
        this.socket.setNoDelay()

        this.socket.on('connect', this.onSocketConnected.bind(this))
        this.socket.on('data',  this.onSocketData.bind(this))
        this.socket.on('drain', this.onSocketDrain.bind(this))
        this.socket.on('close', this.onSocketClosed.bind(this))
        this.socket.on('error', this.onSocketError.bind(this))
      })
    })
    .timeout(this.connectTimeout)
    .catch(Promise.TimeoutError, err => {
      debug('connection timed out', err)
      this.onSocketConnectTimeout()
    })
  }

  // Resolves when the zookeeper connection state is CONNECTED
  waitConnect(){
    return new Promise((resolve, reject) => {
      if (this.state !== STATES.DISCONNECTED || this.state !== STATES.CONNECTING)
        return reject(new Error('already disconnected'))
      this.once('state', state => {
        return (state === STATES.CONNECTED) ? resolve(true) : reject(false)
      })
      this.connect()

    })
  }

  close(){
    return new Promise((resolve) => {
      switch(this.state){
        case STATES.CLOSING:
        case STATES.CLOSED:
        case STATES.DISCONNECTED:
        case STATES.AUTH_FAILED:
        case STATES.SESSION_EXPIRED:
        return resolve(true)
      }
      let header = new jute.protocol.RequestHeader().setType('CLOSE_SESSION')
      let request = null
      request = new jute.Request(header, null)
      this.setState(STATES.CLOSING)

      return resolve(this.queue(request))
    })
  }

  waitClose(){

  }

  onSocketClosed(error) {
    let retry = false
    let errorCode = null

    switch (this.state) {
    
      case STATES.CLOSING:
          errorCode = Exception.CONNECTION_LOSS
          retry = false
          break
    
      case STATES.SESSION_EXPIRED:
          errorCode = Exception.SESSION_EXPIRED
          retry = false
          break
      
      case STATES.AUTH_FAILED:
          errorCode = Exception.AUTH_FAILED
          retry = false
          break

      default:
          errorCode = Exception.CONNECTION_LOSS
          this.debug('error was set to CONNECTION_LOSS but was', error)
          retry = true
    }

    this.cleanupPendingQueue(errorCode)
    this.setState(STATES.DISCONNECTED)

    if (retry) this.connect()
    else this.setState(STATES.CLOSED)

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
    this.debug('onSocketConnected')
    let connectRequest,
      authRequest,
      setWatchesRequest,
      header,
      payload

    if (this.connectTimeoutHandler) clearTimeout(this.connectTimeoutHandler)

    connectRequest = new jute.Request(null, new jute.protocol.ConnectRequest(
      jute.PROTOCOL_VERSION,
      this.zxid,
      this.sessionTimeout,
      this.sessionId,
      this.sessionPassword
    ))

    // XXX No read only support yet.
    this.socket.write(connectRequest.toBuffer())

    // Set auth info
    if (this.credentials.length > 0) {
      this.credentials.forEach(credential => {
        header = new jute.protocol.RequestHeader()
        payload = new jute.protocol.AuthPacket()

        header.xid = jute.XID_AUTHENTICATION
        header.type = jute.OP_CODES.AUTH

        payload.type = 0
        payload.scheme = credential.scheme
        payload.auth = credential.auth

        authRequest = new jute.Request(header, payload)
        this.queue(authRequest)

      }, this)
    }

    // Reset the watchers if we have any.
    if (!this.watcherManager.isEmpty()) {
      header = new jute.protocol.RequestHeader()
      payload = new jute.protocol.SetWatches()

      header.type = jute.OP_CODES.SET_WATCHES
      header.xid = jute.XID_SET_WATCHES

      payload.setChrootPath(this.chrootPath)
      payload.relativeZxid = this.zxid
      payload.dataWatches = this.watcherManager.getDataWatcherPaths()
      payload.existWatches = this.watcherManager.getExistenceWatcherPaths()
      payload.childWatches = this.watcherManager.getChildWatcherPaths()

      setWatchesRequest = new jute.Request(header, payload)
      this.queue(setWatchesRequest)
    }
  };


  onSocketTimeout() {
    let header, request

    if (!this.socket) return this.debug('onSocketTimeout - no socket')
    if (this.state === STATES.CONNECTED ||
        this.state === STATES.CONNECTED_READ_ONLY) {

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
      pendingPacket,
      responseHeader,
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

    if (this.state === STATES.CONNECTING) {
      // Handle connect response.
      connectResponse = new jute.protocol.ConnectResponse()
      offset += connectResponse.deserialize(buffer, offset)


      if (connectResponse.timeOut <= 0) {
        this.setState(STATES.SESSION_EXPIRED)

      } else {
        // Reset the server connection attempts since we connected now.
        this.serverAttempts = 0

        this.sessionId = connectResponse.sessionId
        this.sessionPassword = connectResponse.passwd
        this.updateTimeout(connectResponse.timeOut)

        this.setState(STATES.CONNECTED)

        // Check if we have anything to send out just in case.
        this.onPacketQueueReadable()

        this.socket.setTimeout(
          this.pingTimeout,
          this.onSocketTimeout.bind(this)
        )

      }
    } else {
        // Handle  all other responses.
        responseHeader = new jute.protocol.ReplyHeader()
        offset += responseHeader.deserialize(buffer, offset)

        // TODO BETTTER LOGGING
        switch (responseHeader.xid) {
        
        case jute.XID_PING:
            this.debug('onSocketData got ping')
            break
        
        case jute.XID_AUTHENTICATION:
            this.debug('onSocketData got auth')
            if (responseHeader.err === Exception.AUTH_FAILED) {
              this.setState(STATES.AUTHENTICATION_FAILED)
            }
            break

        case jute.XID_NOTIFICATION:
            this.debug('onSocketData notificatin')
            event = new jute.protocol.WatcherEvent()

            if (this.chrootPath) {
              event.setChrootPath(this.chrootPath)
            }

            offset += event.deserialize(buffer, offset)
            this.watcherManager.emit(event)
            break
        
        default:
            this.debug('onSocketData standard packet')
            pendingPacket = this.pendingQueue.shift()

            if (!pendingPacket) {
              this.debug('Nothing in pending queue but got data from server')
              this.debug('destroying socket')
              this.socket.destroy() // this will trigger reconnect
              return
            }

            if (pendingPacket.request.header.xid !== responseHeader.xid) {
              this.debug('Xid out of order. Got xid:%s wanted:%s', 
                responseHeader.xid, pendingPacket.request.header.xid)
              this.debug('destroying socket')
              this.socket.destroy() // this will trigger reconnect
              return
            }

            if (responseHeader.zxid) {
              // TODO, In Java implementation, the condition is to
              // check whether the long zxid is greater than 0, here
              // use buffer so we simplify.
              // Need to figure out side effect.
              this.zxid = responseHeader.zxid
            }

            if (responseHeader.err === 0) {
              switch (pendingPacket.request.header.type) {
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
                  this.debug('Unknown request OP_CODE: %s', pendingPacket.request.header.type)
                  this.debug('destroying socket')
                  this.socket.destroy() // this will trigger reconnect
                  return
              }

              if (responsePayload) {
                if (this.chrootPath) responsePayload.setChrootPath(this.chrootPath)
                offset += responsePayload.deserialize(buffer, offset)
              }

              if (pendingPacket.resolve) {
                this.debug('resolving pending packet with new response')
                pendingPacket.resolve( new jute.Response(responseHeader, responsePayload))
              }
            } else if (pendingPacket.reject) {
              let err = Exception.create(responseHeader.err)
              err.response = new jute.Response(responseHeader, null)
              pendingPacket.reject(err)
            }
        }
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
      case STATES.CONNECTED:
      case STATES.CONNECTED_READ_ONLY:
      case STATES.CLOSING:
          break

      // Skip since we can not send traffic out
      case STATES.DISCONNECTED:
      case STATES.CONNECTING:
      case STATES.CLOSED:
      case STATES.SESSION_EXPIRED:
      case STATES.AUTHENTICATION_FAILED:
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
        this.debug('onPacketQueueReadable: No socket available')
        this.setState(STATES.DISCONNECTED)
        break 
      }

      let buf = packet.request.toBuffer()
      this.debug('onPacketQueueReadable: writing to socket', buf.read(4),buffer.read(4,4), buf.read(undef,8))
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
      case STATES.CONNECTED:
      case STATES.CONNECTED_READ_ONLY:
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

      case STATES.DISCONNECTED:
      case STATES.CONNECTING:
      case STATES.CLOSING:
      case STATES.CLOSED:
      case STATES.SESSION_EXPIRED:
      case STATES.AUTHENTICATION_FAILED:
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

        case STATES.DISCONNECTED:
        case STATES.CONNECTING:
        case STATES.CONNECTED:
        case STATES.CONNECTED_READ_ONLY:
            // queue the packet, attach promise
            return this.packetQueue.push({
              request: request,
              resolve: resolve,
              reject: reject
            })

        case STATES.CLOSING:
            if (request.header && request.header.type === jute.OP_CODES.CLOSE_SESSION) {
              return this.packetQueue.push({
                request: request,
                resolve: resolve,
                reject: reject
              })
            }
            return reject(Exception.create(Exception.CONNECTION_LOSS))

        case STATES.CLOSED:
            return reject(Exception.create(Exception.CONNECTION_LOSS))

        case STATES.SESSION_EXPIRED:
            return reject(Exception.create(Exception.SESSION_EXPIRED))

        case STATES.AUTHENTICATION_FAILED:
            return reject(Exception.create(Exception.AUTH_FAILED))

        default:
            return reject(new ZkError(`Can't queue in unknown state "${this.state}"`))
        }
    })
  }

}
ConnectionManager.init()

module.exports = ConnectionManager
