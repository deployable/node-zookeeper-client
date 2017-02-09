
const {
  JuteTypeInt,
  JuteTypeLong,
  JuteTypeBoolean,
  JuteTypeBuffer,
  JuteTypeString,
  JuteTypeVector,
  JuteTypeData,
  JuteTypeLookup
} = require('../lib/jute/Types')


describe('Unit::jute::Types', function(){

  describe('JuteTypeInt', function(){

    it('should create an int', function(){
      let int = JuteTypeInt.create(5)
      expect( int ).to.be.ok
      expect( int.value ).to.eql( 5 )
      expect( int.bytes ).to.equal( 4 )
    })

    it('should serialize', function(){
      let buf = new Buffer(4)
      let int = JuteTypeInt.create(5)
      int.serialize(buf, 0)
      expect(buf.toString()).to.equal('\u0000\u0000\u0000\u0005')
    })

    it('should deserialize', function(){
      let buf = new Buffer(8)
      buf.writeInt32BE(4,0)
      let int = JuteTypeInt.createDeserialize(buf,0)
      expect(int.value).to.equal(4)
    })
  })

  describe('JuteTypeLong', function(){

    it('should create a long', function(){
      let long = JuteTypeLong.create(7)
      expect( long.value ).to.eql( Buffer.from([0,0,0,0,0,0,0,7]) )
      expect( long.bytes ).to.equal( 8 )
    })

    it('should serialize', function(){
      let buf = new Buffer(8)
      let int = JuteTypeLong.create(6)
      int.serialize(buf, 0)
      expect( buf ).to.eql(Buffer.from([0,0,0,0,0,0,0,6]))
    })

    it('should deserialize', function(){
      let buf = new Buffer(16)
      buf.writeInt32BE(4,8)
      let int = JuteTypeInt.createDeserialize(buf,8)
      expect(int.value).to.equal(4)
    })

    it('should compare two short longs', function(){
      let low = JuteTypeLong.create(7)
      let high = JuteTypeLong.create(8)
      expect( high.isGreaterThan(low) ).to.be.true
    })

    it('should compare two long longs', function(){
      let low = JuteTypeLong.create(14865056721531)
      let high = JuteTypeLong.create(14865056721542)
      expect( high.isGreaterThan(low) ).to.be.true
    })

    it('should compare two long longs', function(){
      let low = JuteTypeLong.create(14865056721531)
      let high = JuteTypeLong.create(14865056721542)
      expect( low.isGreaterThan(high) ).to.be.false
    })

    it('should compare two long longs', function(){
      let high = JuteTypeLong.create(14865056721531)
      expect( high.isGreaterThan(high) ).to.be.false
    })

  })

  describe('JuteTypeBoolean', function(){

    it('should create a boolean', function(){
      let bool = JuteTypeBoolean.create(true)
      expect( bool.value ).to.be.true
      expect( bool.bytes ).to.equal( 1 )
    })

    it('should serialize', function(){
      let buf = new Buffer(8).fill(0)
      let int = JuteTypeBoolean.create(true)
      int.serialize(buf, 0)
      expect( buf ).to.eql(Buffer.from([1,0,0,0,0,0,0,0]))
    })

    it('should deserialize', function(){
      let buf = new Buffer(16)
      buf.writeUInt8(1,8)
      let boo = JuteTypeBoolean.createDeserialize(buf,8)
      expect(boo.value).to.equal(true)
    })

  })


  describe('JuteTypeBuffer', function(){

    it('should create a string', function(){
      let buff = JuteTypeBuffer.create(Buffer.from('test'))
      expect( buff.value.toString() ).to.equal( 'test' )
      expect( buff.bytes ).to.equal( 8 )
    })

    it('should serialize astring', function(){
      let buf = new Buffer(20).fill(0)
      let jbufval = new Buffer.from('astring')
      let jbuf = JuteTypeBuffer.create(jbufval)
      jbuf.serialize(buf, 8)
      expect( buf ).to.eql(Buffer.from([0,0,0,0,0,0,0,0,0,0,0,7,97,115,116,114,105,110,103,0]))
    })

    it('should serialize an empty buffer', function(){
      let buf = new Buffer(20).fill(0)
      let jbuf = JuteTypeBuffer.create()
      jbuf.serialize(buf, 8)
      expect( buf ).to.eql(Buffer.from([0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0]))
    })

    it('should deserialize', function(){
      let buf = Buffer.from('aaaabca')
      buf.writeInt32BE(2,0)
      let boo = new JuteTypeBuffer()
      boo.deserialize(buf,0)
      expect( boo.value ).to.be.ok
      expect( boo.value ).to.be.a.buffer
      expect( boo.value.toString() ).to.equal('bc')
    })

    it('should create + deserialize', function(){
      let buf = Buffer.from('aaaabca')
      buf.writeInt32BE(1,0)
      let boo = JuteTypeBuffer.createDeserialize(buf, 0)
      expect( boo.value ).to.be.ok
      expect( boo.value ).to.be.a.buffer
      expect( boo.value.toString() ).to.equal('b')
    })
  })


  describe('JuteTypeString', function(){

    it('should create a string', function(){
      let string = JuteTypeString.create('atest')
      expect( string.value ).to.equal( 'atest' )
      expect( string.bytes ).to.equal( 9 )
    })

    it('should serialize', function(){
      let buf = new Buffer(20).fill(0)
      let jstr = JuteTypeString.create('astring')
      jstr.serialize(buf, 5)
      expect( buf ).to.eql(Buffer.from([0,0,0,0,0,0,0,0,7,97,115,116,114,105,110,103,0,0,0,0]))
    })

    it('should deserialize', function(){
      let buf = Buffer.from('abcde0000ijklmnop')
      let jstr = JuteTypeString.createDeserialize(buf,5)
      expect(jstr.value).to.equal('ijklmnop')
    })
  })


  describe('JuteTypeVector', function(){

    it('should create a vector', function(){
      let vals = ['test1atesate', 'test2atesate']
      let vect = JuteTypeVector.create(JuteTypeString, vals)
      expect( vect.value[0].value ).to.eql( 'test1atesate' )
      expect( vect.value[1].value ).to.eql( 'test2atesate' )
      // 4 + 4+12 + 4+12
      expect( vect.bytes ).to.equal( 36 )
    })

    it('should serialize', function(){
      let buf = new Buffer(24).fill(0)
      let vect = JuteTypeVector.create(JuteTypeString, ['onea', 'twob'])
      // 4 + 4+4 + 4+4 
      vect.serialize(buf, 1)
      let res = Buffer.from(
        [0,0,0,0,2,0,0,0,4,111,110,101,97,0,0,0,4,116,119,111,98,0,0,0]
      )
      expect( buf ).to.eql( res )
    })

    it('should deserialize', function(){
      let buf = Buffer.from([0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4])
      let jstr = JuteTypeVector.createDeserialize(JuteTypeInt, buf, 0)
      expect(jstr.value.length).to.equal(4)
      expect(jstr.value[0].value).to.equal(1)
      expect(jstr.value[1].value).to.equal(2)
      expect(jstr.value[2].value).to.equal(3)
      expect(jstr.value[3].value).to.equal(4)
    })
  })

})
