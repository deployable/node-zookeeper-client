
const Client = require('../../lib/Client')

describe('Client', function () {

  describe('instance', function () {

    it('should create a client instance', function () {
      expect( new Client('test') ).to.be.an.instanceof( Client )
    })

  })

})
