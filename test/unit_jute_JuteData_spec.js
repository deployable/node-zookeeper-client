
const { JuteData } = require('../lib/jute/Data')


let types = [
  'Id',
  'ACL',
  'Stat'
]


describe('Unit::jute::JuteData', function(){

  describe('class', function(){

    describe('.types', function(){

      it('should have a spec', function(){
        types.forEach(type => {
          expect( JuteData.types[type].spec, type ).to.be.ok
        })
      })

      it('should have a spec attributes order', function(){
        types.forEach(type => {
          expect( JuteData.types[type].spec.order, type ).to.be.ok
        })
      })

      it('should have spec attributes', function(){
        types.forEach(type => {
          expect( JuteData.types[type].spec.attributes, type ).to.be.ok
        })
      })

    })

    describe('.create()', function(){

      it('should throw on missing type', function(){
        expect( JuteData.create( 'Id' ) ).to.be.ok
      })

    })

  })
})
