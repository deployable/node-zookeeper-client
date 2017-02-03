const { Jute } = require('./Jute.js')
const { Record } = require('./Record.js')

const {
  tint,
  tlong,
  tboolean,
  tbuffer,
  tustring,
  tvector,
  tdata
} = require('./TypeHelper')


class ConnectRequest extends Record {
  constructor(protocolVersion, lastZxidSeen, timeOut, sessionId, passwd){
    super(arguments)
    this.protocolVersion = tint(protocolVersion)
    this.lastZxidSeen = tlong(lastZxidSeen)
    this.timeOut = tint(timeOut)
    this.sessionId = tlong(sessionId)
    this.passwd = tbuffer(passwd)
  }
}
ConnectRequest.spec = { 
  order: [ 'protocolVersion', 'lastZxidSeen', 'timeOut', 'sessionId', 'passwd' ],
  attributes: {
    protocolVersion: { type: 'int'},
    lastZxidSeen: { type: 'long'},
    timeOut: { type: 'int'},
    sessionId: { type: 'long'},
    passwd: { type: 'buffer'}
  }
}


class ConnectResponse extends Record {
  constructor(protocolVersion, timeOut, sessionId, passwd){
    super(arguments)
    this.protocolVersion = tint(protocolVersion)
    this.timeOut = tint(timeOut)
    this.sessionId = tlong(sessionId)
    this.passwd = tbuffer(passwd)
  }
}
ConnectResponse.spec = {
  order: [ 'protocolVersion', 'timeOut', 'sessionId', 'passwd'],
  attributes: {
    protocolVersion: { type: 'int' },
    timeOut: { type: 'int' },
    sessionId: { type: 'long' },
    passwd: { type: 'buffer' }
  }
}


class RequestHeader extends Record {
  constructor(xid, type){
    super(arguments)
    this.xid = tint(xid)
    this.type = tint(type)
  }
}
RequestHeader.spec = {
  order: ['xid', 'type'],
  attributes: {
    xid: { type: 'int' },
    type: { type: 'int'}    
  }
}


class ReplyHeader extends Record {
  constructor(xid, zxid, err){
    super(arguments)
    this.xid = tint(xid)
    this.zxid = tlong(zxid)
    this.err = tint(err)
  }
}
ReplyHeader.spec = {
  order: ['xid', 'zxid', 'err'],
  attributes: {
    xid: { type: 'int' },
    zxid: { type: 'long'},
    err: { type: 'int'}
  }
}


class AuthPacket extends Record {
  constructor(type, scheme, auth){
    super(arguments)
    this.type = tint(type)
    this.scheme = tustring(scheme)
    this.auth = tbuffer(auth)
  }
}

AuthPacket.spec = {
  order: ['type', 'scheme', 'auth'],
  attributes: {
    type: { type: 'int' },
    scheme: { type: 'ustring' },
    auth: { type: 'buffer' }
  }
}


class CreateRequest extends Record {
  constructor(path, data, acl, flags){
    super(arguments)
    this.path = tustring(path)
    this.data = tbuffer(data)
    this.acl = tvector(acl, 'data.ACL')
    this.flags = tint(flags)
  }
}

CreateRequest.spec = {
  order: [],
  attributes: {
    path: { type: 'ustring' },
    data: { type: 'buffer' },
    acl: { type: 'vector<data.ACL>', sub_type: 'data.ACL' },
    flags: { type: 'int' }
  }
}


class CreateResponse extends Record {
  constructor(path){
    super(arguments)
    this.path = tustring(path)
  }
}
CreateResponse.spec = {
  order: [],
  attributes: {}
}
{
  path: {type: 'ustring' }
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
    path: {type: 'ustring' },
    version: {type: 'int' }
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
    path: {type: 'ustring' },
    watch: {type: 'boolean' }
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
    children: { type: 'vector<ustring>', sub_type: 'string'  },
    stat: { type: 'data.Stat' }
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
    path: {type: 'ustring' },
    watch: {type: 'boolean' }
  }
}


class ExistsResponse extends Record {
  constructor(stat){
    super(arguments)
    this.stat = tdata(stat)
  }
}
ExistsResponse.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    stat: {type: 'data.Stat', sub_type: 'Stat'  }
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
    path: {type: 'ustring' },
    data: {type: 'buffer' },
    version: {type: 'int' }
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
    stat: {type: 'data.Stat', sub_type: 'Stat'  }
  }
}

class GetDataRequest extends Record {
  constructor(path, watch){
    super(arguments)
    this.path = tustring(path)
    this.watch = tboolean(watch)
  }
}
GetDataRequest.spec = {
  order: [ 'path', 'watch' ],
  attributes: {
    path: {type: 'ustring' },
    watch: {type: 'boolean' }
  }
}


class GetDataResponse extends Record {
  constructor(data, stat){
    super(arguments)
    this.data = tdata(data)
    this.stat = tstat(stat)
  }
}
GetDataResponse.spec = {
  order: [ 'data', 'stat' ],
  attributes: {
    data: {type: 'buffer' },
    stat: {type: 'data.Stat', sub_type: 'Stat'  }
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
    path: {type: 'ustring' }
  }
}


class GetACLResponse extends Record {
  constructor(acl, stat){
    super(arguments)
    this.acl = tvector(acl)
    this.stat = tdata(stat)
  }
}
GetACLResponse.spec = {
  order: ['acl', 'stat'],
  attributes: {
    acl: {type: 'vector<data.ACL>', sub_type: 'data.ACL'  },
    stat: {type: 'data.Stat', sub_type: 'Stat'  }
  }
}


class SetACLRequest extends Record {
  constructor(path, acl, version){
    super(arguments)
    this.path = tustring(path)
    this.acl = tvector(acl)
    this.version = tint(version)
  }
}
SetACLRequest.spec = {
  order: ['path', 'acl', 'version'],
  attributes: {
    path: {type: 'ustring' },
    acl: {type: 'vector<data.ACL>', sub_type: 'data.ACL'  },
    version: {type: 'int' }
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
    stat: {type: 'data.Stat', sub_type: 'Stat'  }
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
    type: {type: 'int' },
    state: {type: 'int' },
    path: {type: 'ustring' }
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
    dataWatches: {type: 'vector<ustring>', sub_type: 'ustring'  },
    existWatches: {type: 'vector<ustring>', sub_type: 'ustring'  },
    childWatches: {type: 'vector<ustring>', sub_type: 'ustring'  }
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
    type: {type: 'int' },
    done: {type: 'boolean' },
    err: {type: 'int' }
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
    path: {type: 'ustring' },
    version: {type: 'int' }
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
    err: {type: 'int' }
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
