
const Client = require('../lib/Client')

let host = process.env.ZOOKEEPER_HOST || 'localhost'
let port = process.env.ZOOKEEPER_PORT || 2183
let connection_string = `${host}:${port}`


describe('Integration::Client', function(){


  describe('Connection', function(){

    let client = null

    before(function(){
      client = new Client(connection_string)
    })

    after(function(){
      return client.close()
    })

    it('should connect', function(){
      return expect( client.connect() ).to.become( true )
    })

    it('should have session id', function(){
      expect( client.getSessionId().toString('hex') ).to.equal('0000000000000000')
    })
    
    it('should have a `connected` state', function(done){
      client.once('state', state => {
        expect( state ).to.equal(3)
        done()
      })
    })

    it('should create some data', function(done){
      client.create('/', Buffer.from('testing'), done)
    })

    it('should close', function(done){
      return client.close(done)
    })

  })
})
