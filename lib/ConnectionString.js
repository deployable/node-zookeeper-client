/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const debug = require('debug')('dply:zk-client:ConnectionString')

const { shuffle, compact, clone, chain } = require('lodash')

const { Validate } = require('./Validate')
const { ZkError } = require('./errors')
const { DEFAULT_PORT } = require('./constants') // Default Zookeeper client port.

/**
 * This class parses the connection string to build the ensemble server
 * list and a possible chroot path.
 *
 * @module zk-client
 * @class ConnectionString
 * @constructor
 * @param connection_string {String} ZooKeeper server ensemble string.
 */

class ConnectionString {

  constructor (conn_string) {
    if ( typeof conn_string !== 'string' || conn_string === ''  )
      throw new ZkError('The connection string must be a non-empty string.')

    this.conn_string = conn_string
    this.parseString()
    this.shuffleServers()
  }

  parseString(){
    // Handle chroot
    let [ hosts, ...paths ] = this.conn_string.split('/')
    let chroot_path = undefined

    // Make sure we do have paths and also not just a '/' with no path
    if ( paths.length > 0 && paths[0] !== '' ) {
      chroot_path = '/' + paths.join('/')
      Validate.path(chroot_path)
      this.chroot_path = chroot_path
      debug('chrootPath set to "%s"', this.chroot_path)
    } 

    let servers = chain(hosts)
      .split(',')
      .compact()
      .map(item => {
        let [ host, port ] = item.split(':')
        return {
          host: host,
          port: port || DEFAULT_PORT
        }
      })
      .value()

    debug('conn_string:%s servers:%j', this.conn_string, servers)

    if ( servers.length === 0 )
      throw new ZkError(`The connection string must contain at least one server. ${this.conn_string}`)

    return this.servers = servers
  }
 
  shuffleServers(){
    return this.servers = shuffle(this.servers)
  }


  /**
   * Return the connection string of this host provider.
   *
   * @method getConnectionString
   * @return The connection string.
   */
  getConnectionString () {
    return this.conn_string
  }

  getChrootPath () {
    return this.chroot_path
  }

  getServers () {
    // shallow copy of array
    return clone(this.servers)
  }

}


module.exports = { ConnectionString, ZkError }
