/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {Exception} = require('../lib/Exception')


describe('Exception', function () {

  describe('create', function () {

    it('should only accept number code', function () {
      expect(()=> Exception.create('zzz') ).to.throw('Unknown Error code')
      expect(()=> Exception.create() ).to.throw('Unknown Error code')
      expect(()=> Exception.create(null) ).to.throw('Unknown Error code')
    })

    it('should only accept predefined code', function () {
      expect(()=> Exception.create(111111) ).to.throw('Unknown Error code')
      expect(()=> Exception.create(-111111) ).to.throw('Unknown Error code')
    })

    it('should return an instance of Error', function () {
      let e = Exception.create(Exception.OK)
      expect(e).to.be.instanceof(Error)
    })

    it('should return an instance of Exception', function () {
      let e = Exception.create(Exception.OK)
      expect(e).to.be.instanceof(Exception)
    })
  })

  describe('getCode', function () {

    it('should return the given code.', function () {
      let e = Exception.create(Exception.SYSTEM_ERROR)
      expect(e.getCode()).to.equal(Exception.SYSTEM_ERROR)
    })
  })

  describe('getName', function () {

    it('should return the correct name.', function () {
      let e = Exception.create(Exception.SYSTEM_ERROR)
      expect(e.getName()).to.equal('SYSTEM_ERROR')
    })
  })

  describe('getPath', function () {

    it('should return the correct path.', function () {
      let e = Exception.create(Exception.SYSTEM_ERROR, '/test')
      expect(e.getPath()).to.equal('/test')
    })
  })

  describe('toString', function () {

    it('should return the correctly formatted string.', function () {
      let e1 = Exception.create(Exception.NO_NODE, '/test')
      let e2 = Exception.create(Exception.NO_NODE)

      expect(e1.toString()).to.equal(
        `Exception: NO_NODE[${Exception.NO_NODE}]@/test`
      )
      expect(e2.toString()).to.equal(
        `Exception: NO_NODE[${Exception.NO_NODE}]`
      )
    })
  })
})
