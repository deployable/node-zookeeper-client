/**
 * Original code Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

/**
 *
 * A pure Javascript ZooKeeper client.
 *
 * @module node-zookeeper-client
 *
 */


//const Promise           = require('bluebird')
const debug             = require('debug')('dply:node-zookeeper-client:index')
debug('loading')

const Client            = require('./lib/Client')
const ACL               = require('./lib/ACL')
const Id                = require('./lib/Id')
const Event             = require('./lib/Event')
const State             = require('./lib/State')
const Permission        = require('./lib/Permission')
const CreateMode        = require('./lib/CreateMode')
const Exception         = require('./lib/Exception')

const { CLIENT_DEFAULT_OPTIONS } = require('./constants')
const { defaultStateListener, attempt } = require('./functions')

/**
 * Create a new ZooKeeper client.
 *
 * @method createClient
 * @for node-zookeeper-client
 */
function createClient(connectionString, options) {
    return new Client(connectionString, options)
}

module.exports = {
  ACL, Client, Id, Permission, CreateMode, State, Event, Exception,
  CLIENT_DEFAULT_OPTIONS,
  createClient, defaultStateListener, attempt
}

debug('loaded')
