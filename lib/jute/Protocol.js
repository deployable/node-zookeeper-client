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


// Recrod helper

class ACLRecord extends Record {
  get acl(){ return this._acl }
  set acl(val){
    this._acl = JuteTypeVector.create(JuteDataZkACL, val)
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
    this._czxid = JuteTypeLong.create(val)
  }
  
  get mzxid()     { return this._mzxid }
  set mzxid(val)  { 
    this._bytes = undefined
    this._mxzid = JuteTypeLong.create(val)
  }
  
  get ctime()     { return this._ctime }
  set ctime(val)  { 
    this._bytes = undefined
    this._ctime = JuteTypeLong.create(val)
  }
  
  get mtime()     { return this._mtime }
  set mtime(val)  { 
    this._bytes = undefined
    this._mtime = JuteTypeLong.create(val)
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
    this._pzxid = JuteTypeLong.create(val)
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
    czxid: JuteTypeLong,
    mzxid: JuteTypeLong,
    ctime: JuteTypeLong,
    mtime: JuteTypeLong,
    version: JuteTypeInt,
    cversion: JuteTypeInt,
    aversion: JuteTypeInt,
    ephemeralOwner: JuteTypeLong,
    dataLength: JuteTypeInt,
    numChildren: JuteTypeInt,
    pzxid: JuteTypeLong
  }
}


// ## Protocol request/response

class ConnectRequest extends Record {
  constructor(protocolVersion, lastZxidSeen, timeOut, sessionId, passwd){
    super(arguments)
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
    lastZxidSeen: JuteTypeLong,
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
    zxid: JuteTypeLong,
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


class CreateRequest extends ACLRecord {
  static type(type_string){
    let req = new this()
    req.type = jute_op_codes[type_string]
    return req
  }
  constructor(path, data, acl, flags){
    super(arguments)
    this.path  = path
    this.data  = data
    this.acl   = acl
    this.flags = flags
  }
}

CreateRequest.spec = {
  order: [ 'path', 'data', 'acl', 'flags' ],
  attributes: {
    path: JuteTypeString,
    data: JuteTypeBuffer,
    acl: JuteTypeVector.create(JuteDataZkACL),
    flags: JuteTypeInt
  }
}


class CreateTTLRequest extends ACLRecord {
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
    this.path = path
    this.watch = watch
  }
}
GetChildren2Request.spec = {
  order: [ 'ustring', 'boolean' ],
  attributes: {
    path: JuteTypeString,
    watch: JuteTypeBoolean
  }
}


class GetChildren2Response extends Record {
  constructor(children, stat){
    super(arguments)
    this.children = children
    this.stat = stat
  }
}
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
SetDataResponse.spec = {
  order: [ 'stat' ],
  attributes: {
    stat: JuteDataZkStat
  }
}

class GetDataRequest extends Record {
  constructor(zkpath, watch){
    super(arguments)
    this.path = zkpath
    this.watch = watch
  }
  get watch(){ return this._watch}
  set watch(val){ this._watch = JuteTypeBoolean.create(val) }
}
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
    this.data = data
    this.stat = stat
  }
  get stat(){ return this._stat}
  set stat(val){ 
    if ( val instanceof JuteDataZkStat ) return this._stat = val
    if ( !val ) return this._stat = new JuteDataZkStat()
    throw new JuteTypeError(`GetDataResponse requires a "JuteDataZkStat" for "stat". Got ${typeof val}`)
  }
}
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
GetACLRequest.spec = {
  order: ['path'],
  attributes: {
    path: JuteTypeString
  }
}


class GetACLResponse extends ACLRecord {
  constructor(acl, stat){
    super(arguments)
    this.acl = acl
    this.stat = stat
  }
}
GetACLResponse.spec = {
  order: ['acl', 'stat'],
  attributes: {
    acl: JuteTypeVector.create(JuteDataZkACL),
    stat: JuteDataZkStat
  }
}





class SetACLRequest extends ACLRecord {
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
    relativeZxid: JuteTypeLong,
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
  ConnectRequest,
  ConnectResponse,
  RequestHeader,
  ReplyHeader,
  AuthPacket,
  CreateRequest,
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
