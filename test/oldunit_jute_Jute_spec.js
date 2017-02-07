
const { Jute } = require('../lib/jute/Jute')


describe('Unit::jute::Jute', function(){

  describe('class', function(){

    describe('.create()', function(){

      it('should throw on missing type', function(){
        let fn = () => Jute.create( 'whatever', Buffer.alloc(8), 0)
        expect( fn ).to.throw('No Jute type "whatever"') 
      })

    })
  })
})
