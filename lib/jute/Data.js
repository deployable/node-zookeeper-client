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
    this.scheme = tustring(scheme)
    this.id = tustring(id)
  }
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
    this.perms = tint(perms)
    this.id = tdata(id)
  }
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
    this.czxid = tlong(czxid)
    this.mzxid = tlong(mzxid)
    this.ctime = tlong(ctime)
    this.mtime = tlong(mtime)
    this.version = tint(version)
    this.cversion = tint(cversion)
    this.aversion = tint(aversion)
    this.ephemeralOwner = tlong(ephemeralOwner)
    this.dataLength = tint(dataLength)
    this.numChildren = tint(numChildren)
    this.pzxid = tlong(pzxid)
  }
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
