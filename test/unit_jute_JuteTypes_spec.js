
const {
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeUString,
  JuteTypeVector,
  JuteTypeData,
  JuteTypeLookup
} = require('../lib/jute/Types')


describe('Unit::jute::Types', function(){

  describe('JuteTypeInt', function(){

    describe('.create()', function(){

      it('should create an int', function(){
        let int = JuteTypeInt.create(5)
        expect( int ).to.be.ok
        expect( int.value ).to.eql( 5 )
        expect( int.bytes ).to.equal( 4 )
      })

    })
  })

  describe('JuteTypeLong', function(){

    describe('.create()', function(){

      it('should create a long', function(){
        let long = JuteTypeLong.create(7)
        expect( long.value ).to.eql( Buffer.from([0,0,0,0,0,0,0,0]) )
        expect( long.bytes ).to.equal( 8 )
      })

    })
  })

  describe('JuteTypeBoolean', function(){

    describe('.create()', function(){

      it('should create a boolean', function(){
        let bool = JuteTypeBoolean.create(true)
        expect( bool.value ).to.be.true
        expect( bool.bytes ).to.equal( 1 )
      })

    })
  })

  describe('JuteTypeBuffer', function(){

    describe('.create()', function(){

      it('should create a ustring', function(){
        let buff = JuteTypeBuffer.create(Buffer.from('test'))
        expect( buff.value.toString() ).to.equal( 'test' )
        expect( buff.bytes ).to.equal( 8 )
      })

    })
  })

  describe('JuteTypeUString', function(){

    describe('.create()', function(){

      it('should create a ustring', function(){
        let ustring = JuteTypeUString.create('atest')
        expect( ustring.value ).to.equal( 'atest' )
        expect( ustring.bytes ).to.equal( 9 )
      })

    })
  })

  describe('JuteTypeVector', function(){

    describe('.create()', function(){

      it('should create a vector', function(){
        let vals = ['test1atesate','test2atesate']
        let vect = JuteTypeVector.create('ustring', vals)
        expect( vect.value[0].value ).to.eql( 'test1atesate' )
        expect( vect.value[1].value ).to.eql( 'test2atesate' )
        // 4 + 4+12 + 4+12
        expect( vect.bytes ).to.equal( 36 )
      })
    })
  })

  describe('JuteTypeData', function(){

    describe('.create()', function(){

      it('should create a Data', function(){
        let data = JuteTypeData.create('ustring')
        expect( data.value.value = 'test' ).to.eql( 'test' )
        expect( data.value.value ).to.eql( 'test' )
      })

    })
  })
})
