
const Client = require('../lib/Client')

let host = process.env.ZOOKEEPER_HOST || 'localhost'
let port = process.env.ZOOKEEPER_PORT || 2183
let connection_string = `${host}:${port}`


describe('Integration::Client', function(){


  describe('Connection', function(){

    let client = null

    beforeEach(function(){
      client = new Client(connection_string)
    })

    it('should emit some state', function(){
      client.emit('state','test')
    })

  })
})
