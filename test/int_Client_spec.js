
const Client = require('../lib/Client')

let host = process.env.ZOOKEEPER_HOST || 'localhost'
let port = process.env.ZOOKEEPER_PORT || 2183
let connection_string = `${host}:${port}`


describe('Integration::Client', function(){

  describe('First Connect', function(){

    let client = null

    it('should create a client', function(){
      client = new Client(connection_string)
      expect( client ).to.be.ok
    })

    it('should connect a client', function(){
      return expect( client.connect() ).to.become( true )
    })

    it('should close a client', function(){
      return expect( client.close() ).to.become( true )
    })

  })

  describe('Connection', function(){

    let client = null

    before(function(){
      client = new Client(connection_string)
      return expect( client.connect() ).to.become( true )
    })

    after(function(){
      return client.close()
    })

    // it('should connect', function(){
    //   return expect( client.connect() ).to.be.rejectedWith()
    // })
    
    it('should have a `connected` state', function(done){
      client.once('state', state => {
        expect( state ).to.equal(3)
        done()
      })
    })

    it('should have session id like 0159fe552a2401a0', function(){
      expect( client.getSessionId().toString('hex') ).to.match(/^[0-9a-f]{16}$/)
    })

    it('should create some data', function(){
      let prm = client.create('/', {data: Buffer.from('testing')})
      return expect( prm ).to.become('/')
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
