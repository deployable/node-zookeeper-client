/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


/**
 * The package queue which emits events.
 */

const { EventEmitter } = require('events')


class PacketQueue extends EventEmitter {
    
  constructor(){
    super()        
    this.queue = []
  }


  push(packet) {
    if (typeof packet !== 'object') throw new Error('packet must be a valid object.')

    this.queue.push(packet)
    this.emit('readable')
  }


  unshift(packet) {
    if (typeof packet !== 'object') throw new Error('packet must be a valid object.')

    this.queue.unshift(packet)
    this.emit('readable')
  }

  shift() {
    return this.queue.shift()
  }

}

module.exports = PacketQueue
