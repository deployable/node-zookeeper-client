
const crypto = require('crypto')

const Client = require('../lib/Client')

let host = process.env.ZOOKEEPER_HOST || 'localhost'
let port = process.env.ZOOKEEPER_PORT || 2183
let connection_string = `${host}:${port}`


describe('Integration::Client', function(){

  describe('Connection', function(){

    let client = null

    it('should create a client', function(){
      client = new Client(connection_string)
      expect( client ).to.be.ok
    })

    it('should connect a client', function(){
      this.timeout(10000)
      return expect( client.connect() ).to.become( true )
    })

    it('should close a client', function(){
      return expect( client.close() ).to.become( true )
    })

  })

  describe('Operations', function(){

    let client = null
    let node_path = crypto.randomBytes(8).toString('hex')

    before(function(){
      this.timeout(10000)
      client = new Client(connection_string)
      return expect( client.connect() ).to.become( true )
    })

    after(function(){
      return client.close()
    })

    // it('should connect', function(){
    //   return expect( client.connect() ).to.be.rejectedWith()
    // })
    
    it('should have a `connected` state', function(){
      expect( client.getState() ).to.equal(3)
    })

    it('should have session id like 0159fe552a2401a0', function(){
      expect( client.getSessionId().toString('hex') ).to.match(/^[0-9a-f]{16}$/)
    })

    it('should create some data', function(){
      let prm = client.create(
        `/${node_path}`,
        {data: Buffer.from('testing')}
      )
      return prm.then(res => {
        expect(res).to.eql( `/${node_path}` )
      })
    })

    it('should check data exists', function(){
      let prm = client.exists(`/${node_path}`)
      //return expect(prm).to.become( `/${node_path}` )
      return prm.then(res => {
        expect( res ).to.have.keys(
          'czxid',
          'mzxid',
          'ctime',
          'mtime',
          'version',
          'cversion',
          'aversion',
          'ephemeralOwner',
          'dataLength',
          'numChildren',
          'pzxid'
        )
      })
    })

    it('should remove some data', function(){
      let prm = client.remove(`/${node_path}`)
      //return expect(prm).to.become( `/${node_path}` )
      return expect(prm).to.become( true )
    })

    it('should create a test node', function(){
      return expect(client.mkdirp('/test') ).to.become('/test')
    })

    it('should create a test/test2 node', function(){
      let prm = client.mkdirp('/test/test2')
      return expect( prm ).to.become('/test/test2')
    })

    it('should setData on /test', function(){
      let now = Date.now()
      let prm = client.setData('/test', Buffer.from('testing'))
      return prm.then(res =>{
        expect( res ).to.have.keys(
          'czxid',
          'mzxid',
          'ctime',
          'mtime',
          'version',
          'cversion',
          'aversion',
          'ephemeralOwner',
          'dataLength',
          'numChildren',
          'pzxid'
        )
        expect( res.ctime ).to.be.a.number
        expect( res.mtime ).to.be.at.least( now )
      })
    })

    it('should getData on /test', function(){
      return client.
      getData('/test').then(res =>{
        expect( res.data ).to.ok
        expect( res.data.toString() ).to.equal('testing')
        expect( res.stat ).to.be.ok
      })
    })

    // it('should get some data', function(){
    //   return client.getData('/').then(res => {
    //     expect( res.stat ).to.be.ok
    //     expect( res.data ).to.be.ok
    //     expect( res.data.toString() ).to.equal('')
    //   })
    // })

    // it('should close', function(){
    //   return expect( client.close() ).to.eventually.be.ok
    // })

  })
})
