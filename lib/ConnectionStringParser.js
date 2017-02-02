/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


const assert = require('assert')
const { shuffle, compact } = require('lodash')

const Path   = require('./Path.js')

// Constants.
const { DEFAULT_PORT } = require('../') // Default Zookeeper client port.

/**
 * This class parse the connection string to build the ensemble server
 * list and chrootPath.
 *
 * @module node-zookeeper-client
 */
/**
 *
 * Parse the connect string and random the servers of the ensemble.
 *
 * @module node-zookeeper-client
 * @class ConnectionStringParser
 * @constructor
 * @param connectionString {String} ZooKeeper server ensemble string.
 */
module.exports = class ConnectionStringParser {

  constructor (connectionString) {
    assert(
      connectionString && typeof connectionString === 'string',
      'connectionString must be a non-empty string.'
    )

    this.connectionString = connectionString

    // Handle chroot
    let index = connectionString.indexOf('/')
    let hostList = []
    let servers = []

    if (index !== -1 && index !== (connectionString.length - 1)) {
      this.chrootPath = connectionString.substring(index)
      Path.validate(this.chrootPath)
    } else {
      this.chrootPath = undefined
    }

    if (index !== -1) {
        hostList = connectionString.substring(0, index).split(',')
    } else {
        hostList = connectionString.split(',')
    }

    compact(hostList).forEach(item => {
      let parts = item.split(':')
      servers.push({
        host: parts[0],
        port: parts[1] || DEFAULT_PORT
      })
    })

    assert(
      servers.length > 0,
      'connectionString must contain at least one server.'
    )

    // Randomize the list.
    this.servers = shuffle(servers)
  }

  /**
   * Return the connection string of this host provider.
   *
   * @method getConnectionString
   * @return The connection string.
   */
  getConnectionString () {
    return this.connectionString
  }

  getChrootPath () {
    return this.chrootPath
  }

  getServers () {
    return this.servers.slice(0)
  }

}

