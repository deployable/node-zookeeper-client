const { Jute } = require('./Jute.js')
const { Record } = require('./Record.js')


class ConnectRequest extends Record {
  constructor(protocolVersion, lastZxidSeen, timeOut, sessionId, passwd){
    this.protocolVersion = tint(protocolVersion)
    this.lastZxidSeen = tlong(lastZxidSeen)
    this.timeOut = tint(timeOut)
    this.sessionId = tlong(sessionId)
    this.passwd = tbuffer(passwd)
  }
}
ConnectRequest.spec = [
  { name: 'protocolVersion', type: 'int'},
  { name: 'lastZxidSeen', type: 'long'},
  { name: 'timeOut', type: 'int'},
  { name: 'sessionId', type: 'long'},
  { name: 'passwd', type: 'buffer'}
]


class ConnectResponse extends Record {
   constructor(protocolVersion, timeOut, sessionId, passwd){
    this.protocolVersion = tint(protocolVersion)
    this.timeOut = tint(timeOut)
    this.sessionId = tlong(sessionId)
    this.passwd = tbuffer(passwd)
  }
}

ConnectResponse.spec = [
  { name: 'protocolVersion', type: 'int' },
  { name: 'timeOut', type: 'int' },
  { name: 'sessionId', type: 'long' },
  { name: 'passwd', type: 'buffer' }
]


class RequestHeader extends Record {
  constructor(xid, type){
    this.xid = tint(xid)
    this.type = tint(type)
  }
}
RequestHeader.spec = [
  { name: 'xid', type: 'int' },
  { name: 'type', type: 'int'}
]


class ReplyHeader extends Record {
  constructor(xid, zxid, err){
    this.xid = tint(xid)
    this.zxid = tlong(zxid)
    this.err = tint(err)
  }
}
ReplyHeader.spec =[
  { name: 'xid', type: 'int' },
  { name: 'zxid', type: 'long'},
  { name: 'err', type: 'int'}
]


class AuthPacket extends Record {
  constructor(type, schem, auth){
    this.type = tint(type)
    this.scheme = tustring(scheme)
    this.auth = tbuffer(auth)
  }
}

AuthPacket.spec = [
  { name: 'type', type: 'int' },
  { name: 'scheme', type: 'ustring' },
  { name: 'auth', type: 'buffer' }
]


class CreateRequest extends Record {
  constructor(path, data, acl, flags){
    this.path = tustring(path)
    this.data = tbuffer(data)
    this.acl = tvector(acl, 'data.ACL')
    this.flags = tint(flags)
  }
}

CreateRequest.spec = [
  { name: 'path', type: 'ustring' },
  { name: 'data', type: 'buffer' },
  { name: 'acl', type: 'vector<data.ACL>', sub_type: 'data.ACL' },
  { name: 'flags', type: 'int' }
]


class CreateResponse extends Record {
  constructor(path){
    this.path = path
  }
}
CreateResponse.spec = {
  path: {type: 'ustring' }
}


class DeleteRequest extends Record {
  constructor(path, version){
    this.path = path
    this.version = version
  }
}
DeleteRequest.spec = {
  path: {type: 'ustring' },
  version: {type: 'int' }
}

class GetChildren2Request extends Record {
  constructor(){
  }
}
GetChildren2Request.spec = {
  path: {type: 'ustring' },
  watch: {type: 'boolean' }
}


class GetChildren2Response extends Record {
  constructor(children, stat){
    this.children = children
    this.stat = stat
  }
}
GetChildren2Response.spec = {
  children: { type: 'vector<ustring>', sub_type: 'string'  },
  stat: { type: 'data.Stat' }
}


class ExistsRequest extends Record {
  constructor(path, watch){
    this.path = path
    this.watch = watch
  }
}
ExistsRequest.spec = {
  path: {type: 'ustring' },
  watch: {type: 'boolean' }
}


class ExistsResponse extends Record {
  constructor(stat){
    this.stat = stat
  }
}
ExistsResponse.spec = {
  stat: {type: 'data.Stat', sub_type: 'Stat'  }
}


class SetDataRequest extends Record {
  constructor(path, data, version){
    this.path = path
    this.data = data
    this.version = version
  }
}
SetDataRequest.spec = {
  path: {type: 'ustring' },
  data: {type: 'buffer' },
  version: {type: 'int' }
}

class SetDataResponse extends Record {
  constructor(stat){
    this.stat = stat
  }
}
SetDataResponse.spec = {
  stat: {type: 'data.Stat', sub_type: 'Stat'  }
}


class GetDataRequest extends Record {
  constructor(path, watch){
    this.path = path
    this.watch = watch
  }
}
GetDataRequest.spec = {
  path: {type: 'ustring' },
  watch: {type: 'boolean' }
}


class GetDataResponse extends Record {
  constructor(data, stat){
    this.data = data
    this.stat = stat
  }
}
GetDataResponse.spec = {
  data: {type: 'buffer' },
  stat: {type: 'data.Stat', sub_type: 'Stat'  }
}


class GetACLRequest extends Record {
  constructor(path){
    this.path = path
  }
}
GetACLRequest.spec = {
  path: {type: 'ustring' }
}


class GetACLResponse extends Record {
  constructor(act, stat){
    this.act = act
    this.stat = stat
  }
}
GetACLResponse.spec = {
  acl: {type: 'vector<data.ACL>', sub_type: 'data.ACL'  },
  stat: {type: 'data.Stat', sub_type: 'Stat'  }
}


class SetACLRequest extends Record {
  constructor(path, acl, version){
    this.path = path
    this.acl = acl
    this.version = version
  }
}
SetACLRequest.spec = {
  path: {type: 'ustring' },
  acl: {type: 'vector<data.ACL>', sub_type: 'data.ACL'  },
  version: {type: 'int' }
}


class SetACLResponse extends Record {
  constructor(stat){
    this.stat = stat
  }
}

SetACLResponse.spec = {
  stat: {type: 'data.Stat', sub_type: 'Stat'  }
}


class WatcherEvent extends Record {
  constructor(type, state, path){
    this.type = type
    this.state = state
    this.path = path
  }
}
WatcherEvent.spec = {
  type: {type: 'int' },
  state: {type: 'int' },
  path: {type: 'ustring' }
}

class SetWatches extends Record {
  constructor(relativeZxid, dataWatches, existWatches, childWatches){
    this.relativeZxid = relativeZxid
    this.dataWatches = dataWatches
    this.existWatches = existWatches
    this.childWatches = childWatches
  }
}
SetWatches.spec = {
  relativeZxid: {type: 'long' },
  dataWatches: {type: 'vector<ustring>', sub_type: 'ustring'  },
  existWatches: {type: 'vector<ustring>', sub_type: 'ustring'  },
  childWatches: {type: 'vector<ustring>', sub_type: 'ustring'  }
}


class MultiHeader extends Record {
  constructor(type, done, err){
    this.type = type
    this.done = done
    this.err = err
  }
}
MultiHeader.spec = {
  type: {type: 'int' },
  done: {type: 'boolean' },
  err: {type: 'int' }
}


class CheckVersionRequest extends Record {
  constructor(path, version){
    this.path = path
    this.version = version
  }
}
CheckVersionRequest.spec = {
  path: {type: 'ustring' },
  version: {type: 'int' }
}


class ErrorResponse extends Record {
  constructor(err){
    this.err = err
  }
}
ErrorResponse.spec = {
  err: {type: 'int' }
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
