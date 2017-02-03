
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

    it('should connect', function(){
      return expect( client.connect() ).to.become( true )
    })

    it('should have session id', function(){
      expect( client.getSessionId().toString('hex') ).to.equal('0000000000000000')
    })
    
    it('should have a `connected` state', function(){
      expect( client.getState().code ).to.equal(3)
    })

    it('should close', function(){
      return client.close()
    })

  })
})
