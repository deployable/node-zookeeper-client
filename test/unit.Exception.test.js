/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {ZkException} = require('../lib/errors')


describe('Unit::ZkException', function () {

  describe('create', function () {

    it('should only accept number code', function () {
      expect(()=> ZkException.create('zzz') ).to.throw('Unknown Error code')
      expect(()=> ZkException.create() ).to.throw('Unknown Error code')
      expect(()=> ZkException.create(null) ).to.throw('Unknown Error code')
    })

    it('should only accept predefined code', function () {
      expect(()=> ZkException.create(111111) ).to.throw('Unknown Error code')
      expect(()=> ZkException.create(-111111) ).to.throw('Unknown Error code')
    })

    it('should return an instance of Error', function () {
      let e = ZkException.create(ZkException.OK)
      expect(e).to.be.instanceof(Error)
    })

    it('should return an instance of ZkException', function () {
      let e = ZkException.create(ZkException.OK)
      expect(e).to.be.instanceof(ZkException)
    })
  })

  describe('getCode', function () {

    it('should return the given code.', function () {
      let e = ZkException.create(ZkException.SYSTEM_ERROR)
      expect(e.getCode()).to.equal(ZkException.SYSTEM_ERROR)
    })
  })

  describe('getName', function () {

    it('should return the correct name.', function () {
      let e = ZkException.create(ZkException.SYSTEM_ERROR)
      expect(e.getName()).to.equal('SYSTEM_ERROR')
    })
  })

  describe('getPath', function () {

    it('should return the correct path.', function () {
      let e = ZkException.create(ZkException.SYSTEM_ERROR, '/test')
      expect(e.getPath()).to.equal('/test')
    })
  })

  describe('toString', function () {

    it('should return the correctly formatted string.', function () {
      let e1 = ZkException.create(ZkException.NO_NODE, '/test')
      let e2 = ZkException.create(ZkException.NO_NODE)

      expect(e1.toString()).to.equal(
        `ZkException: NO_NODE[${ZkException.NO_NODE}]@/test`
      )
      expect(e2.toString()).to.equal(
        `ZkException: NO_NODE[${ZkException.NO_NODE}]`
      )
    })
  })
})
