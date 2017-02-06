const debug = require('debug')('dply:node-zookeeper-client:jute:Data')

const { Jute } = require('./Jute')
const { Record } = require('./Record')
//const { JuteError } = require('./errors')

const {
  tint,
  tlong,
//  tboolean,
//  tbuffer,
  tustring,
//  tvector,
  tdata
} = require('./TypeHelper')


class Id extends Record {
  constructor(scheme, id){
    super(arguments)
    this.scheme = scheme
    this.id = id
    this.name = 'Id'
  }
  get id (){ return this._id }
  set id(val){ this._id = tustring(val) }
  get scheme (){ return this._scheme }
  set scheme(val){ this._scheme = tustring(val) }
}
Id.spec = {
  order: ['scheme', 'id'],
  attributes: {
    scheme: {type: 'ustring' },
    id: { type: 'ustring' }
  }
}


class ACL extends Record {
  constructor(perms, id){
    super(arguments)
    this.perms = perms
    this.id = id
    this._name = 'ACL'
  }
  get perms (){ return this._perms }
  set perms(val){ this._perms = tint(val) }
  get id (){ return this._id }
  set id(val){ this._id = tdata(val, 'Id') }
}
ACL.spec = {
  order: [ 'perms', 'id' ],
  attributes: {
    perms: { type: 'int' },
    id: { type: 'data.Id', sub_type: 'Id' }
  }
}


class Stat extends Record {
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
    this.name = 'Stat'
  }
  get czxid()     { return this._czxid }
  set czxid(val)  { this._czxid = tlong(val) }
  get mzxid()     { return this._mzxid }
  set mzxid(val)  { this._mxzid = tlong(val) }
  get ctime()     { return this._ctime }
  set ctime(val)  { this._ctime = tlong(val) }
  get mtime()     { return this._mtime }
  set mtime(val)  { this._mtime = tlong(val) }
  get cversion()  { return this._cversion }
  set cversion(val){ this._cversion = tint(val) }
  get aversion()  { return this._aversion}
  set aversion(val){ this._aversion = tint(val) }
  get ephemeralOwner(){return this._ephemeralOwner }
  set ephemeralOwner(val){ this._ephemeralOwner = tlong(val) }
  get dataLength(){ return this._dataLength }
  set dataLength(val){ this._dataLength = tint(val)}
  get numChildren(){ return this._numChildren }
  set numChildren(val){ this._numChildren = tint(val) }
  get pzxid(){ return this._pzxid }
  set pzxid(val){ this._pzxid = tlong(val) }
  
}
Stat.spec = {
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
    czxid: { type: 'long' },
    mzxid: { type: 'long' },
    ctime: { type: 'long' },
    mtime: { type: 'long' },
    version: { type: 'int' },
    cversion: { type: 'int' },
    aversion: { type: 'int' },
    ephemeralOwner: { type: 'long' },
    dataLength: { type: 'int' },
    numChildren: { type: 'int' },
    pzxid: { type: 'long' }
  }
}


class JuteData extends Jute {}
JuteData.types = {
  Id,
  ACL,
  Stat
}


module.exports = {
  JuteData,
  Id,
  ACL,
  Stat
} 
