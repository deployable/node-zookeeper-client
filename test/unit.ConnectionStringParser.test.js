/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 */

const ConnectionStringParser = require('../lib/ConnectionStringParser')


describe('ConnectionStringParser', function () {

  describe('constructor', function () {

    it('should reject null, undefined and empty string', function () {
      expect(()=> new ConnectionStringParser() ).to.throw('non-empty string')
      expect(()=> new ConnectionStringParser(null) ).to.throw('non-empty string')
      expect(()=> new ConnectionStringParser('') ).to.throw('non-empty string')
    })

    it('should reject invalid chroot path', function () {
      let fn = ()=> new ConnectionStringParser('localhost:2181/../test/')
      expect( fn ).to.throw('path')
    })

    it('should reject empty server list.', function () {
      let fn = ()=> new ConnectionStringParser('/test')
      expect( fn ).to.throw('at least one')
    })
  })


  describe('getConnectionString', function () {

    it('should return the same string passed to constructor', function () {
        let s = 'localhost:2181'
        let parser = new ConnectionStringParser(s)
        expect( parser.getConnectionString() ).to.equal(s)
    })
  })


  describe('getChrootPath', function () {

    it('should return non-empty chroot', function () {
      let parser = new ConnectionStringParser('localhost:2181/test')
      expect(parser.getChrootPath()).to.equal('/test')
    })

    it('should return undefined for empty chroot', function () {
      let parser = new ConnectionStringParser('localhost:2181')
      expect(parser.getChrootPath()).to.be.undefined
    })

    it('should work for multiple servers', function () {
      let parser = new ConnectionStringParser('localhost:2181,localhost:2182/test')
      expect(parser.getChrootPath()).to.equal('/test')
    })
  })


  describe('getServers', function () {

    it('should return an array of host:port objects', function () {
      let s = 'localhost:2181,localhost:2182',
          parser = new ConnectionStringParser(s),
          servers = parser.getServers()

      expect(servers).to.be.instanceof(Array).that.have.length(2)
      expect(servers).to.have.deep.property('[0].host', 'localhost')
      expect(servers).to.have.deep.property('[0].port').match(/218[12]/)
      expect(servers).to.have.deep.property('[1].host', 'localhost')
      expect(servers).to.have.deep.property('[1].port').match(/218[12]/)
    })

    it('should add default port if port is not provided', function () {
      var s = 'localhost',
          parser = new ConnectionStringParser(s),
          servers = parser.getServers()

      expect(servers).to.be.instanceof(Array).that.have.length(1)
      expect(servers).to.have.deep.property('[0].host', 'localhost')
      expect(servers).to.have.deep.property('[0].port', 2181)
    })
  })
})
