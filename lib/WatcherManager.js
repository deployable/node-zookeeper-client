/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const events = require('events')
const {forEach} = require('lodash')

const {Validate} = require('./Validate')
const Event = require('./Event')

class WatcherManager{

  constructor(){
    this.dataWatchers = {}
    this.childWatchers = {}
    this.existenceWatchers = {}
  }

  static registerWatcher(self, type, node_path, watcher) {
    let watchers = self[type + 'Watchers']
    let watcherExists = false

    Validate.path(node_path)

    if (typeof watcher !== 'function')
      throw new ZkError('watcher must be a valid function.')

    watchers[node_path] = watchers[node_path] || new events.EventEmitter()
    watcherExists = watchers[node_path].listeners('notification').some(function (l) {
      // This is rather hacky since node.js wraps the listeners using an
      // internal function.
      return l === watcher || l.listener === watcher
    })

    if (!watcherExists)
      watchers[node_path].once('notification', watcher)

  }

  static getWatcherPaths(self, type) {
    let watchers = self[type + 'Watchers']
    let result = []

    Object.keys(watchers).forEach(node_path => {
      if (watchers[node_path].listeners('notification').length > 0) {
        result.push(node_path)
      }
    })

    return result
  }

  registerDataWatcher (node_path, watcher) {
    this.constructor.registerWatcher(this, 'data', node_path, watcher)
  }

  getDataWatcherPaths () {
    return this.constructor.getWatcherPaths(this, 'data')
  }

  registerChildWatcher (node_path, watcher) {
    this.constructor.registerWatcher(this, 'child', node_path, watcher)
  }

  getChildWatcherPaths () {
    return this.constructor.getWatcherPaths(this, 'child')
  }

  registerExistenceWatcher (node_path, watcher) {
    this.constructor.registerWatcher(this, 'existence', node_path, watcher)
  }

  getExistenceWatcherPaths () {
    return this.constructor.getWatcherPaths(this, 'existence')
  }

  emit (watcherEvent) {
    if (!watcherEvent)
      throw new ZkError('watcherEvent must be a valid object.')

    let emitters = []
    let event = null

    switch (watcherEvent.type) {
      case Event.NODE_DATA_CHANGED:
      case Event.NODE_CREATED:
        if (this.dataWatchers[watcherEvent.path]) {
            emitters.push(this.dataWatchers[watcherEvent.path])
            delete this.dataWatchers[watcherEvent.path]
        }

        if (this.existenceWatchers[watcherEvent.path]) {
            emitters.push(this.existenceWatchers[watcherEvent.path])
            delete this.existenceWatchers[watcherEvent.path]
        }
        break

      case Event.NODE_CHILDREN_CHANGED:
        if (this.childWatchers[watcherEvent.path]) {
            emitters.push(this.childWatchers[watcherEvent.path])
            delete this.childWatchers[watcherEvent.path]
        }
        break

      case Event.NODE_DELETED:
        if (this.dataWatchers[watcherEvent.path]) {
            emitters.push(this.dataWatchers[watcherEvent.path])
            delete this.dataWatchers[watcherEvent.path]
        }
        if (this.childWatchers[watcherEvent.path]) {
            emitters.push(this.childWatchers[watcherEvent.path])
            delete this.childWatchers[watcherEvent.path]
        }
        break

      default:
        throw new ZkError('Unknown event type: ' + watcherEvent.type)
    }

    if (emitters.length < 1) return

    event = Event.create(watcherEvent)

    emitters.forEach(emitter => emitter.emit('notification', event))
  }

  isWatchersEmpty(watcher_object){
    let empty = true
    forEach(watcher_object, (key, value) => {
      if (value.listeners('notification').length > 0) {
        empty = false
        return false
      }
    })
    return empty
  }

  isEmpty () {
    let empty = true
    let watchers = [this.dataWatchers, this.existenceWatchers, this.childWatchers]

    forEach(watchers, obj => this.isWatchersEmpty(obj))

    return empty
  }

}

module.exports = {
  WatcherManager
}
