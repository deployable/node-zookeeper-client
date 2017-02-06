const { Jute } = require('./Jute.js')
const { Record } = require('./Record.js')
const jute_op_codes = require('./OpCodes.js')
const { 
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeUString,
  JuteTypeVector,
  JuteTypeData,
  JuteTypeLookup
}                 = require('./Types')


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
  set protocolVersion(val){ this._protocolVersion = tint(val) }
  get lastZxidSeen(){ return this._lastZxidSeen }
  set lastZxidSeen(val){ this._lastZxidSeen = tlong(val) }
  get timeOut(){ return this._timeOut }
  set timeOut(val){ this._timeOut = tint(val) }
  get sessionId(){ return this._sessionId }
  set sessionId(val){ this._sessionId = tlong(val) }
  get passwd(){ return this._passwd }
  set passwd(val){ this._passwd = tbuffer(val) }
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
  set protocolVersion(val){ this._protocolVersion = tint(val) }
  get timeOut(){ return this._timeOut }
  set timeOut(val){ this._timeOut = tint(val) }
  get sessionId(){ return this._sessionId }
  set sessionId(val){ this._sessionId = tlong(val) }
  get passwd(){ return this._passwd }
  set passwd(val){ this._passwd = tbuffer(val) }
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
    let req = new this()
    req.type = jute_op_codes[type_string]
    return req
  }

  constructor(xid, type){
    super(arguments)
    this.xid = xid
    this.type = type
  }
  get xid(){ return this._xid}
  set xid(val){ this._xid = tint(val) }
  get type(){ return this._type}
  set type(val){ this._type = tint(val) }

  setType(type_string){
    this.debug('setting request to %s', type_string)
    if (jute_op_codes[type_string]) {
      this.type = jute_op_codes[type_string]
      return this
    }
    throw new Error(`No request type ${type_string}`)
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
    this.type = tint(type)
    this.scheme = tustring(scheme)
    this.auth = tbuffer(auth)
  }
  get type(){ return this._type}
  set type(val){ this._type = tint(val) }
  get scheme(){ return this._scheme}
  set scheme(val){ this._scheme = tustring(val) }
}

AuthPacket.spec = {
  order: ['type', 'scheme', 'auth'],
  attributes: {
    type: JuteTypeInt,
    scheme: JuteTypeUString,
    auth: JuteTypeBuffer,
  }
}


class CreateRequest extends Record {
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
    path: JuteTypeUString,
    data: JuteTypeBuffer,
    acl: JuteTypeVector.data('ACL'),
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
}
CreateTTLRequest.spec = {
  order: [ 'path', 'data', 'acl', 'flags', 'ttl' ],
  attributes: {
    path: JuteTypeUString,
    data: JuteTypeBuffer,
    acl: JuteTypeVector.data('ACL'),
    flags: JuteTypeInt,
    ttl: JuteTypeLong
  }
}

class CreateResponse extends Record {
  constructor(path){
    super(arguments)
    this.path = tustring(path)
  }
}
CreateResponse.spec = {
  order: ['path'],
  attributes: {
    path: JuteTypeUString
  }
}

class DeleteRequest extends Record {
  constructor(path, version){
    super(arguments)
    this.path = tustring(path)
    this.version = version
  }
}
DeleteRequest.spec = {
  order: [ 'path', 'version' ],
  attributes: {
    path: JuteTypeUString,
    version: JuteTypeInt
  }
}

class GetChildren2Request extends Record {
  constructor(path, watch){
    super(arguments)
    this.path = tustring(path)
    this.watch = watch
  }
}
GetChildren2Request.spec = {
  order: [ 'ustring', 'boolean' ],
  attributes: {
    path: JuteTypeUString,
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
    children: JuteTypeVector.create('ustring'),
    stat: JuteTypeData.create('Stat')
  }
}


class ExistsRequest extends Record {
  constructor(path, watch){
    super(arguments)
    this.path = tustring(path)
    this.watch = tboolean(watch)
  }
}
ExistsRequest.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: JuteTypeUString,
    watch: JuteTypeBoolean
  }
}


class ExistsResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = tdata(stat)
  }
}
ExistsResponse.spec = {
  order: [ 'stat' ],
  attributes: {
    stat: JuteTypeData.create('Stat')
  }
}


class SetDataRequest extends Record {
  constructor(path, data, version){
    super(arguments)
    this.path = tustring(path)
    this.data = tbuffer(data)
    this.version = tint(version)
  }
}
SetDataRequest.spec = {
  order: [ 'path', 'data', 'version' ],
  attributes: {
    path: JuteTypeUString,
    data: {type: 'buffer' },
    version: JuteTypeInt
  }
}

class SetDataResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = tdata(stat)
  }
}
SetDataResponse.spec = {
  order: [ 'stat' ],
  attributes: {
    stat: JuteTypeData.create('Stat')
  }
}

class GetDataRequest extends Record {
  constructor(zkpath, watch){
    super(arguments)
    this.path = zkpath
    this.watch = watch
  }
  get watch(){ return this._watch}
  set watch(val){ this._watch = tboolean(val) }
}
GetDataRequest.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: JuteTypeUString,
    watch: JuteTypeBoolean
  }
}


class GetDataResponse extends Record {
  constructor(data, stat){
    super(arguments)
    this.data = tbuffer(data)
    this.stat = tdata(stat, 'Stat')
  }
  get stat(){ return this._stat}
  set stat(val){ this._stat = tdata(val, 'Stat') }
}
GetDataResponse.spec = {
  order: [ 'data', 'stat' ],
  attributes: {
    data: {type: 'buffer' },
    stat: JuteTypeData.create('Stat')
  }
}


class GetACLRequest extends Record {
  constructor(path){
    super(arguments)
    this.path = tustring(path)
  }
}
GetACLRequest.spec = {
  order: ['path'],
  attributes: {
    path: { type: 'ustring' }
  }
}


class GetACLResponse extends Record {
  constructor(acl, stat){
    super(arguments)
    this.acl = tvector(acl, 'data.ACL')
    this.stat = tdata(stat, 'Stat')
  }
}
GetACLResponse.spec = {
  order: ['acl', 'stat'],
  attributes: {
    acl: JuteTypeVector.data('ACL'),
    stat: JuteTypeData.create('Stat')
  }
}





class SetACLRequest extends Record {
  constructor(zkpath, acl, version){
    super(arguments)
    this.path = tustring(zkpath)
    this.acl = tvector(acl, 'data.ACL')
    this.version = tint(version)
  }
  addACLArray(acls){
    this.acl = acls.map(item => item.toRecord())
  }
}
SetACLRequest.spec = {
  order: ['path', 'acl', 'version'],
  attributes: {
    path: JuteTypeUString,
    acl: JuteTypeVector.data('ACL'),
    version: JuteTypeInt
  }
}


class SetACLResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = tdata(stat)
  }
}

SetACLResponse.spec = {
  order: ['stat'],
  attributes: {
    stat: JuteTypeData.create('Stat')
  }
}


class WatcherEvent extends Record {
  constructor(type, state, path){
    super(arguments)
    this.type  = tint(type)
    this.state = tint(state)
    this.path  = tustring(path)
  }
}
WatcherEvent.spec = {
  order: [],
  attributes: {
    type: JuteTypeInt,
    state: JuteTypeInt,
    path: JuteTypeUString
  }
}


class SetWatches extends Record {
  constructor(relativeZxid, dataWatches, existWatches, childWatches){
    super(arguments)
    this.relativeZxid = tlong(relativeZxid)
    this.dataWatches  = tvector(dataWatches)
    this.existWatches = tvector(existWatches)
    this.childWatches = tvector(childWatches)
  }
}
SetWatches.spec = {
  order: ['relativeZxid', 'dataWatches', 'existWatches', 'childWatches'],
  attributes: {
    relativeZxid: {type: 'long' },
    dataWatches: JuteTypeVector.create('ustring'),
    existWatches: JuteTypeVector.create('ustring'),
    childWatches: JuteTypeVector.create('ustring')
  }
}


class MultiHeader extends Record {
  constructor(type, done, err){
    super(arguments)
    this.type = tint(type)
    this.done = tboolean(done)
    this.err  = tint(err)
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
    this.path    = tustring(path)
    this.version = tint(version)
  }
}
CheckVersionRequest.spec = {
  order: ['path','version'],
  attributes: {
    path: JuteTypeUString,
    version: JuteTypeInt
  }
}

class ErrorResponse extends Record {
  constructor(err){
    super(arguments)
    this.err = tint(err)
  }
}
ErrorResponse.spec = {
  order: ['err'],
  attributes: {
    err: JuteTypeInt
  }
}


class JuteProtocol extends Jute {}
JuteProtocol.types = {
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



module.exports = {
  JuteProtocol,
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
