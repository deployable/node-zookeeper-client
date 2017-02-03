const { Jute } = require('./Jute.js')
const { Record } = require('./Record.js')
//const { JuteError } = require('./errors')

class Id extends Record {
  constructor(scheme, id){
    super(arguments)
    this.scheme = scheme
    this.id = id
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
    this.perms = perms
    this.id = id
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
  constructor(perms, id){
    super(arguments)
    this.perms = perms
    this.id = id
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
