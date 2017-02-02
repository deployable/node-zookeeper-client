
const Client = require('../lib/Client')

describe('Client', function(){

  describe('instance', function(){

    describe('simple', function(){

      it('should create a client instance', function () {
        expect( new Client('test') ).to.be.an.instanceof( Client )
      })
    })

    describe('', function(){

      let client = null

      before(function(){
        client = new Client('test')
      })

      it('should create a client instance', function () {
        client.emit('state','test')
      })
    })
  })
})
