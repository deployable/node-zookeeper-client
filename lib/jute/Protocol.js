const debug = require('debug')('dply:zk-client:jute:Protocol')
const { ZkJute } = require('./ZkJute.js')
const { Record } = require('./Record.js')
const jute_op_codes = require('./OpCodes.js')
const { JuteTypeInt,
      JuteTypeLong,
      JuteTypeBoolean,
      JuteTypeBuffer,
      JuteTypeString,
      JuteTypeVector } = require('./Types')
const { JuteError,
      JuteTypeError } = require('./errors')


// ## Record mixins

// These live here rather than in the parent class so they can load other
// Record types. Trying to load these in `Record` results in circular
// dependencies so node `require` barfs (unless you lazy load them). 

function mixinACLRecord (obj){
  Object.defineProperty(obj, 'acl', { 
    get: function() { return this._acl },
    set: function(val) { 
      if ( val instanceof JuteTypeVector ) return this._acl = val
      this._acl = JuteTypeVector.create(JuteDataZkACL, val)
    }
  })
}

function mixinStatRecord (obj){
  Object.defineProperty(obj, 'stat', { 
    get: function() { return this._stat },
    set: function(val) {
      if ( val instanceof JuteDataZkStat ) return this._stat = val
      if ( !val ) return this._stat = new JuteDataZkStat()
      throw new JuteTypeError(`${this.constructor.name} requires a "JuteDataZkStat" for "stat". Got ${typeof val}`)
    }
  })
}

function mixinStatACLRecord (obj){
  mixinStatRecord(obj)
  mixinACLRecord(obj)
}


// ZXids are made up of 2 32bit values
// Low is an incrementing count
// High is an epoch timestamp, set as the time the zk leader took control
class JuteDataZxid extends JuteTypeLong {

  toJS(){
    let o = {}
    o.counter = this.low
    o.epoch = this.high
    o.type = 'Zxid'
    return o
  }

  toBuffer(obj){
    if ( obj.type !== 'Zxid' ) throw new JuteError('Not a Zxid')
    if ( obj.epoch === undefined ) throw new JuteError('No epoch')
    if ( obj.counter === undefined ) throw new JuteError('Not a counter')
    this._value.writeUInt32BE(obj.epoch, 0)
    this._value.writeUInt32BE(obj.counter, 4)
  }

}

// Longs can be `ms` time stamps.
// These fit in the 53bits js int offers, so use ints
class JuteDataTime extends JuteTypeLong {

  bufToInt(){
    let int = parseInt(this._value.toString('hex'), 16)
    if ( int >  Number.MAX_SAFE_INTEGER )
      throw new JuteError(`Time/Long large than highest JS integer ${int} > ${Number.MAX_SAFE_INTEGER}`)
    return int
  }

  toJS(){
    return this.bufToInt()
  }

  toBuffer(val){
    return this.intToBuf(val)
  }
  
}


// ## Protocol data records

class JuteDataZkId extends Record {
  constructor(scheme, id){
    super(arguments)
    debug('created JuteDataZkId', scheme, id)
    this.scheme = scheme
    this.id = id
  }

  get scheme (){ return this._scheme }
  set scheme(val){ 
    this._bytes = undefined
    this._scheme = JuteTypeString.create(val) 
  }

  get id (){ return this._id }
  set id(val){ 
    this._bytes = undefined
    this._id = JuteTypeString.create(val)
  }

  get bytes(){
    if (this._bytes === undefined ) return this._bytes = this.byteLength()
    return this._bytes
  }
  set bytes(val){
    this._bytes = val
  }
}
JuteDataZkId.spec = {
  order: ['scheme', 'id'],
  attributes: {
    scheme: JuteTypeString,
    id: JuteTypeString
  }
}


class JuteDataZkACL extends Record {

  constructor(perms, id){
    super(arguments)
    debug('created JuteDataZkACL', perms, id)
    this.perms = perms
    this.id = id
  }

  get perms (){ return this._perms }
  set perms(val){ 
    this._bytes = undefined
    this._perms = JuteTypeInt.create(val)
  }

  get id (){ return this._id }
  set id(val){ 
    this._bytes = undefined
    if ( val instanceof JuteDataZkId ) return this._id = val
    throw new JuteTypeError(`ACL requires a "JuteDataZkId" for an "id". Got ${typeof val}`)
  }

  get bytes(){
    if (this._bytes === undefined ) return this._bytes = this.byteLength()
    return this._bytes
  }
  set bytes(val){
    this._bytes = val
  }
}
JuteDataZkACL.spec = {
  order: [ 'perms', 'id' ],
  attributes: {
    perms: JuteTypeInt,
    id: JuteDataZkId
  }
}


class JuteDataZkStat extends Record {
  constructor(czxid,
    mzxid,
    ctime,
    mtime,
    version,
    cversion,
    aversion,
    ephemeralOwner,
    dataLength,
    numChildren,
    pzxid
  ){
    super(arguments)
    debug('created JuteDataZkStat', '...')
    this.czxid = czxid
    this.mzxid = mzxid
    this.ctime = ctime
    this.mtime = mtime
    this.version = version
    this.cversion = cversion
    this.aversion = aversion
    this.ephemeralOwner = ephemeralOwner
    this.dataLength = dataLength
    this.numChildren = numChildren
    this.pzxid = pzxid
    this._bytes = undefined
  }
  get czxid()     { return this._czxid }
  set czxid(val)  { 
    this._bytes = undefined
    this._czxid = JuteDataZxid.create(val)
  }
  
  get mzxid()     { return this._mzxid }
  set mzxid(val)  { 
    this._bytes = undefined
    this._mzxid = JuteDataZxid.create(val)
  }
  
  get ctime()     { return this._ctime }
  set ctime(val)  { 
    this._bytes = undefined
    this._ctime = JuteDataTime.create(val)
  }
  
  get mtime()     { return this._mtime }
  set mtime(val)  { 
    this._bytes = undefined
    this._mtime = JuteDataTime.create(val)
  }
  
  get cversion()  { return this._cversion }
  set cversion(val){ 
    this._bytes = undefined
    this._cversion = JuteTypeInt.create(val)
  }
  
  get aversion()  { return this._aversion}
  set aversion(val){ 
    this._bytes = undefined
    this._aversion = JuteTypeInt.create(val)
  }

  get ephemeralOwner(){return this._ephemeralOwner }
  set ephemeralOwner(val){ 
    this._bytes = undefined
    this._ephemeralOwner = JuteTypeLong.create(val)
  }

  get dataLength(){ return this._dataLength }
  set dataLength(val){ 
    this._bytes = undefined
    this._dataLength = JuteTypeInt.create(val)
  }

  get numChildren(){ return this._numChildren }
  set numChildren(val){ 
    this._bytes = undefined
    this._numChildren = JuteTypeInt.create(val)
  }

  get pzxid(){ return this._pzxid }
  set pzxid(val){ 
    this._bytes = undefined
    this._pzxid = JuteDataZxid.create(val)
  }
  
  get bytes(){
    if (this._bytes === undefined ) return this._bytes = this.byteLength()
    return this._bytes
  }
  set bytes(val){
    this._bytes = val
  }
}
JuteDataZkStat.spec = {
  order: [ 'czxid',
    'mzxid',
    'ctime',
    'mtime',
    'version',
    'cversion',
    'aversion',
    'ephemeralOwner',
    'dataLength',
    'numChildren',
    'pzxid'
  ],
  attributes: {
    czxid: JuteDataZxid,
    mzxid: JuteDataZxid,
    ctime: JuteDataTime,
    mtime: JuteDataTime,
    version: JuteTypeInt,
    cversion: JuteTypeInt,
    aversion: JuteTypeInt,
    ephemeralOwner: JuteTypeLong,
    dataLength: JuteTypeInt,
    numChildren: JuteTypeInt,
    pzxid: JuteDataZxid
  }
}


// ## Protocol request/response

class ConnectRequest extends Record {
  constructor(protocolVersion, lastZxidSeen, timeOut, sessionId, passwd){
    super(arguments)
    debug('new ConnectRequest', sessionId)
    this.protocolVersion = protocolVersion
    this.lastZxidSeen = lastZxidSeen
    this.timeOut = timeOut
    this.sessionId = sessionId
    this.passwd = passwd
  }
  get protocolVersion(){ return this._protocolVersion }
  set protocolVersion(val){ this._protocolVersion = JuteTypeInt.create(val) }
  get lastZxidSeen(){ return this._lastZxidSeen }
  set lastZxidSeen(val){ this._lastZxidSeen = JuteTypeLong.create(val) }
  get timeOut(){ return this._timeOut }
  set timeOut(val){ this._timeOut = JuteTypeInt.create(val) }
  get sessionId(){ return this._sessionId }
  set sessionId(val){ this._sessionId = JuteTypeLong.create(val) }
  get passwd(){ return this._passwd }
  set passwd(val){ this._passwd = JuteTypeBuffer.create(val) }
}
ConnectRequest.spec = { 
  order: [ 'protocolVersion', 'lastZxidSeen', 'timeOut', 'sessionId', 'passwd' ],
  attributes: {
    protocolVersion: JuteTypeInt,
    lastZxidSeen: JuteDataZxid,
    timeOut: JuteTypeInt,
    sessionId: JuteTypeLong,
    passwd: JuteTypeBuffer,
  }
}


class ConnectResponse extends Record {
  constructor(protocolVersion, timeOut, sessionId, passwd){
    super(arguments)
    this.protocolVersion = protocolVersion
    this.timeOut = timeOut
    this.sessionId = sessionId
    this.passwd = passwd
  }
  get protocolVersion(){ return this._protocolVersion }
  set protocolVersion(val){ this._protocolVersion = JuteTypeInt.create(val) }
  get timeOut(){ return this._timeOut }
  set timeOut(val){ this._timeOut = JuteTypeInt.create(val) }
  get sessionId(){ return this._sessionId }
  set sessionId(val){ this._sessionId = JuteTypeLong.create(val) }
  get passwd(){ return this._passwd }
  set passwd(val){ this._passwd = JuteTypeBuffer.create(val) }
}
ConnectResponse.spec = {
  order: [ 'protocolVersion', 'timeOut', 'sessionId', 'passwd'],
  attributes: {
    protocolVersion: JuteTypeInt,
    timeOut: JuteTypeInt,
    sessionId: JuteTypeLong,
    passwd: JuteTypeBuffer,
  }
}


class RequestHeader extends Record {
  
  static type(type_string){
    return new this( undefined, jute_op_codes[type_string])
  }

  static code(code){
    return new this( undefined, code)
  }

  constructor(xid, type){
    super(arguments)
    debug('new RequestHeader', xid, type)
    this.xid = xid
    this.type = type
  }
  get xid(){ return this._xid}
  set xid(val){ this._xid = JuteTypeInt.create(val) }
  get type(){ return this._type}
  set type(val){ this._type = JuteTypeInt.create(val) }

  getType(){
    return this.type.value
  }

  isType(type_string){
    return (this.type.value === jute_op_codes[type_string])
  }

  isTypeInt(val){
    return (this.type.value === val)
  }

  setType(type_string){
    debug('%s[%s] setting request to %s', this.constructor.name, this._uid, type_string)
    if (jute_op_codes[type_string]) {
      this.type = jute_op_codes[type_string]
      return this
    }
    throw new Error(`No request type ${type_string}`)
  }

  getXid(){
    return this.xid.value
  }
  isXid(xid){
    return (xid === this.xid.value)
  }

}
RequestHeader.spec = {
  order: ['xid', 'type'],
  attributes: {
    xid: JuteTypeInt,
    type: JuteTypeInt
  }
}


class ReplyHeader extends Record {
  constructor(xid, zxid, err){
    super(arguments)
    this.xid = xid
    this.zxid = zxid
    this.err = err
  }
  getXid(){
    return this.xid.value
  }
  isXid(xid){
    return (xid === this.xid.value)
  }
  getZxidLow(){
    return this.zxid.value.readInt32BE(4)
  }
  getZxidHigh(){
    return this.zxid.value.readInt32BE(0)
  }
}
ReplyHeader.spec = {
  order: ['xid', 'zxid', 'err'],
  attributes: {
    xid: JuteTypeInt,
    zxid: JuteDataZxid,
    err: JuteTypeInt
  }
}


class AuthPacket extends Record {
  constructor(type, scheme, auth){
    super(arguments)
    this.type = type
    this.scheme = scheme
    this.auth = auth
  }
  get type(){ return this._type}
  set type(val){ this._type = JuteTypeInt.create(val) }
  get scheme(){ return this._scheme}
  set scheme(val){ this._scheme = val } 
}

AuthPacket.spec = {
  order: ['type', 'scheme', 'auth'],
  attributes: {
    type: JuteTypeInt,
    scheme: JuteTypeString,
    auth: JuteTypeBuffer,
  }
}


class CreateRequest extends Record {

  constructor(path, data, acl, flags){
    super(arguments)
    this.path  = path
    this.data  = data
    this.acl   = acl
    this.flags = flags
  }
}
mixinACLRecord(CreateRequest.prototype)
CreateRequest.op_code = 1
CreateRequest.op_string = 'CREATE'
CreateRequest.spec = {
  order: [ 'path', 'data', 'acl', 'flags' ],
  attributes: {
    path: JuteTypeString,
    data: JuteTypeBuffer,
    acl: JuteTypeVector.create(JuteDataZkACL),
    flags: JuteTypeInt
  }
}


class CreateTTLRequest extends Record {
  static type(type_string){
    let req = new this()
    req.type = jute_op_codes[type_string]
    return req
  }
  constructor(path, data, acl, flags, ttl){
    super(arguments)
    this.path  = path
    this.data  = data
    this.acl   = acl
    this.flags = flags
    this.ttl = ttl
  }
  get ttl () { return this._ttl}
  set ttl (val) { this._ttl = JuteTypeLong.create(val) }
}
mixinACLRecord(CreateTTLRequest.prototype)
CreateTTLRequest.spec = {
  order: [ 'path', 'data', 'acl', 'flags', 'ttl' ],
  attributes: {
    path: JuteTypeString,
    data: JuteTypeBuffer,
    acl: JuteTypeVector.create(JuteDataZkACL),
    flags: JuteTypeInt,
    ttl: JuteTypeLong
  }
}


class CreateResponse extends Record {
  constructor(path){
    super(arguments)
    this.path = path
  }
}
CreateResponse.spec = {
  order: ['path'],
  attributes: {
    path: JuteTypeString
  }
}


class DeleteRequest extends Record {
  constructor(path, version){
    super(arguments)
    this.path = path
    this.version = version
  }
}
DeleteRequest.op_code = 2
DeleteRequest.op_string = 'DELETE'
DeleteRequest.spec = {
  order: [ 'path', 'version' ],
  attributes: {
    path: JuteTypeString,
    version: JuteTypeInt
  }
}


class GetChildren2Request extends Record {
  constructor(path, watch){
    super(arguments)
    debug('created GetChildren2Request', path, watch)
    this.path = path
    this.watch = watch
  }
}
GetChildren2Request.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: JuteTypeString,
    watch: JuteTypeBoolean
  }
}


class GetChildren2Response extends Record {
  constructor(children, stat){
    super(arguments)
    debug('created GetChildren2Response', children, stat)
    this.children = children
    this.stat = stat
  }
  get children(){
    return this._children
  }
  set children(val){
    this._children = JuteTypeVector.create(JuteTypeString, val)
  }
}
mixinStatRecord(GetChildren2Response.prototype)
GetChildren2Response.spec = {
  order: [ 'children', 'stat' ],
  attributes: {
    children: JuteTypeVector.create(JuteTypeString),
    stat: JuteDataZkStat
  }
}


class ExistsRequest extends Record {
  constructor(path, watch){
    super(arguments)
    debug('new ExistsRequest', path, watch)
    this.path = path
    this.watch = watch
  }
}
ExistsRequest.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: JuteTypeString,
    watch: JuteTypeBoolean
  }
}


class ExistsResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = stat
  }
}
mixinStatRecord(ExistsResponse.prototype)
ExistsResponse.spec = {
  order: [ 'stat' ],
  attributes: {
    stat: JuteDataZkStat
  }
}


class SetDataRequest extends Record {
  constructor(path, data, version){
    super(arguments)
    this.path = path
    this.data = data
    this.version = version
  }
}
SetDataRequest.op_code = 5
SetDataRequest.op_string = 'SET_DATA'
SetDataRequest.spec = {
  order: [ 'path', 'data', 'version' ],
  attributes: {
    path: JuteTypeString,
    data: JuteTypeBuffer,
    version: JuteTypeInt
  }
}

class SetDataResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = stat
  }
}
mixinStatRecord(SetDataResponse.prototype)
SetDataResponse.spec = {
  order: [ 'stat' ],
  attributes: {
    stat: JuteDataZkStat
  }
}

class GetDataRequest extends Record {
  /*
  init(){
    this.op_code = 4
    this.op_string = 'GET_DATA'
    this.spec = {
      order: [ 'path', 'watch' ],
      attributes: {
        path: JuteTypeString,
        watch: JuteTypeBoolean
      }
    }
  }
  */
  constructor(zkpath, watch){
    super(arguments)
    this.path = zkpath
    this.watch = watch
  }
}
GetDataRequest.op_code = 4
GetDataRequest.op_string = 'GET_DATA'
GetDataRequest.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: JuteTypeString,
    watch: JuteTypeBoolean
  }
}


class GetDataResponse extends Record {
  constructor(data, stat){
    super(arguments)
    debug('created GetDataResponse', data, stat)
    this.data = data
    this.stat = stat
  }
}
mixinStatRecord(GetDataResponse.prototype)
GetDataResponse.spec = {
  order: [ 'data', 'stat' ],
  attributes: {
    data: JuteTypeBuffer,
    stat: JuteDataZkStat
  }
}


class GetACLRequest extends Record {
  constructor(path){
    super(arguments)
    this.path = path
  }
}
GetACLRequest.op_code = 6
GetACLRequest.op_string = 'GET_ACL'
GetACLRequest.spec = {
  order: ['path'],
  attributes: {
    path: JuteTypeString
  }
}


class GetACLResponse extends Record {
  constructor(acl, stat){
    super(arguments)
    this.acl = acl
    this.stat = stat
  }
}
mixinStatACLRecord(GetACLResponse.prototype)
GetACLResponse.spec = {
  order: ['acl', 'stat'],
  attributes: {
    acl: JuteTypeVector.create(JuteDataZkACL),
    stat: JuteDataZkStat
  }
}





class SetACLRequest extends Record {
  constructor(zkpath, acl, version){
    super(arguments)
    this.path = zkpath
    this.acl = acl
    this.version = version
  }
  addACLArray(acls){
    this.acl = acls.map(item => item.toRecord())
  }
}
SetACLRequest.op_code = 7
SetACLRequest.op_string = 'SET_ACL'
mixinACLRecord(SetACLRequest.prototype)
SetACLRequest.spec = {
  order: ['path', 'acl', 'version'],
  attributes: {
    path: JuteTypeString,
    acl: JuteTypeVector.create(JuteDataZkACL),
    version: JuteTypeInt
  }
}


class SetACLResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = stat
  }
}
mixinStatRecord(SetACLResponse.prototype)
SetACLResponse.spec = {
  order: ['stat'],
  attributes: {
    stat: JuteDataZkStat
  }
}


class WatcherEvent extends Record {
  constructor(type, state, path){
    super(arguments)
    this.type  = type
    this.state = state
    this.path  = path
  }
}
WatcherEvent.spec = {
  order: [],
  attributes: {
    type: JuteTypeInt,
    state: JuteTypeInt,
    path: JuteTypeString
  }
}


class SetWatches extends Record {
  constructor(relativeZxid, dataWatches, existWatches, childWatches){
    super(arguments)
    this.relativeZxid = relativeZxid
    this.dataWatches  = dataWatches
    this.existWatches = existWatches
    this.childWatches = childWatches
  }
}
SetWatches.spec = {
  order: ['relativeZxid', 'dataWatches', 'existWatches', 'childWatches'],
  attributes: {
    relativeZxid: JuteDataZxid,
    dataWatches: JuteTypeVector.create(JuteTypeString),
    existWatches: JuteTypeVector.create(JuteTypeString),
    childWatches: JuteTypeVector.create(JuteTypeString)
  }
}


class MultiHeader extends Record {
  constructor(type, done, err){
    super(arguments)
    this.type = type
    this.done = done
    this.err  = err
  }
}
MultiHeader.spec = {
  order: ['type', 'done', 'err'],
  attributes: {
    type: JuteTypeInt,
    done: JuteTypeBoolean,
    err: JuteTypeInt
  }
}

class CheckVersionRequest extends Record {
  constructor(path, version){
    super(arguments)
    this.path    = path
    this.version = version
  }
}
CheckVersionRequest.spec = {
  order: ['path','version'],
  attributes: {
    path: JuteTypeString,
    version: JuteTypeInt
  }
}

class ErrorResponse extends Record {
  constructor(err){
    super(arguments)
    this.err = err
  }
}
ErrorResponse.spec = {
  order: ['err'],
  attributes: {
    err: JuteTypeInt
  }
}


const ZkJuteData = {
  JuteDataZkStat,
  JuteDataZkACL,
  JuteDataZkId,
}
ZkJuteData.create = function create(type, ...args){
  return new ZkJuteData[type](...args)
}

const ZkJuteProtocol = {
  ConnectRequest,
  ConnectResponse,
  RequestHeader,
  ReplyHeader,
  AuthPacket,
  CreateRequest,
  CreateTTLRequest,
  CreateResponse,
  DeleteRequest,
  GetChildren2Request,
  GetChildren2Response,
  ExistsRequest,
  ExistsResponse,
  SetDataRequest,
  SetDataResponse,
  GetDataRequest,
  GetDataResponse,
  GetACLRequest,
  GetACLResponse,
  SetACLRequest,
  SetACLResponse,
  WatcherEvent,
  SetWatches,
  MultiHeader,
  CheckVersionRequest,
  ErrorResponse,
}
ZkJuteProtocol.create = function create(type, ...args){
  let cls = ZkJuteProtocol[type]
  if (cls === undefined) throw new JuteError(`No type ${type}`)
  return new ZkJuteProtocol[type](...args)
}

module.exports = {
  ZkJute,
  ZkJuteProtocol,
  ZkJuteData,
  JuteDataZkStat,
  JuteDataZkACL,
  JuteDataZkId,
  JuteDataZxid,
  JuteDataTime,
  ConnectRequest,
  ConnectResponse,
  RequestHeader,
  ReplyHeader,
  AuthPacket,
  CreateRequest,
  CreateTTLRequest,
  CreateResponse,
  DeleteRequest,
  GetChildren2Request,
  GetChildren2Response,
  ExistsRequest,
  ExistsResponse,
  SetDataRequest,
  SetDataResponse,
  GetDataRequest,
  GetDataResponse,
  GetACLRequest,
  GetACLResponse,
  SetACLRequest,
  SetACLResponse,
  WatcherEvent,
  SetWatches,
  MultiHeader,
  CheckVersionRequest,
  ErrorResponse,
} //awk '/^class/{ print "  "$2","; }' Protocol.js
