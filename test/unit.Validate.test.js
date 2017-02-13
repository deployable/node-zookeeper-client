/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const { Validate } = require('../lib/Validate')


describe('Validate', function () {

  describe('path', function () {
  
    it('should reject null, undefined and empty string', function () {
      expect( ()=> Validate.path() ).to.throw('non-empty string')
      expect( ()=> Validate.path(null) ).to.throw('non-empty string')
      expect( ()=> Validate.path('') ).to.throw('non-empty string')
    })

    it('should reject path does not start with /.', function () {
      expect( ()=> Validate.path('abc') ).to.throw('Node path must start with a / character. abc')
    })

    it('should reject path ends with /.', function () {
      expect( ()=> Validate.path('/abc/') ).to.throw('Node path must not end with a / character. /abc/')
    })

    it('should reject path contains empty node.', function () {
      expect( ()=> Validate.path('//a') ).to.throw('empty')
    })

    it('should reject relative path.', function () {
      expect( ()=> Validate.path('/.') ).to.throw('relative path')
      expect( ()=> Validate.path('/./a') ).to.throw('relative path')
      expect( ()=> Validate.path('/..') ).to.throw('relative path')
      expect( ()=> Validate.path('/../a') ).to.throw('relative path')
    })

    it('should accept dot in the the path name', function () {
      expect( ()=> Validate.path('/a.b') ).to.not.throw('relative path')
      expect( ()=> Validate.path('/a..b') ).to.not.throw('relative path')
    })
    
  })
})
