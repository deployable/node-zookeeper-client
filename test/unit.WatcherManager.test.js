/**
 * Copyright (c) 2014 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */


const Event = require('../lib/Event')
const {WatcherManager} = require('../lib/WatcherManager')


describe('WatcherManager', function(){

  describe('registerWatcher', function(){

    it('should not register same watcher more than once for same event and path.', function(){
      let wm = new WatcherManager()
      let count = 0
      let watcher

      watcher = ()=> count += 1

      wm.registerDataWatcher('/test', watcher)
      wm.registerDataWatcher('/test', watcher)

      wm.emit({
        type: Event.NODE_DELETED,
        path: '/test'
      })

      expect(count).to.equal(1)
    })

    it('can register same watcher for different events for the same path.', function(){
      let wm = new WatcherManager()
      let count = 0
      let watcher

      watcher = ()=> count += 1

      wm.registerDataWatcher('/test', watcher)
      wm.registerChildWatcher('/test', watcher)

      wm.emit({
        type: Event.NODE_DELETED,
        path: '/test'
      })

      wm.emit({
        type: Event.NODE_CHILDREN_CHANGED,
        path: '/test'
      })

      expect(count).to.equal(2)
    })
  })
})
