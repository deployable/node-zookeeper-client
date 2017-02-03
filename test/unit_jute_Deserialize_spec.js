
const { Deserialize } = require('../lib/jute/Deserialize')


describe('Unit::Jute::Deserialize', function(){

  describe('class', function(){

    describe('.int()', function(){

      it('should run', function(){
        Deserialize.int(Buffer.from([1,2,3,4]), 0)
      })
    })

    describe('.long()', function(){

      it('should run', function(){
        Deserialize.long(Buffer.from([0,1,2,3]), 0)
      })
    })

    describe('.buffer()', function(){

      it('should run', function(){
        Deserialize.buffer(Buffer.from([0,1,2,3]), 0)
      })
    })

    describe('.ustring()', function(){

      it('should run', function(){
        Deserialize.ustring(Buffer.from([0,1,2,3]), 0)
      })
    })

    describe('.boolean()', function(){

      it('should run', function(){
        Deserialize.boolean(Buffer.from([1]), 0)
      })
    })

    describe('.vector()', function(){

      it('should run', function(){
        Deserialize.vector('boolean', Buffer.from([0,0,0,2,0,1]), 0)
      })
    })

    describe('.data()', function(){

      it('should run', function(){
        // Id = ustring 32bit lenght, data : ustring 32 bit length, data
        Deserialize.data('Id', Buffer.from([0,0,0,1,36,0,0,0,1,37]), 0)
      })
    })

    describe('.type()', function(){

      it('should vector', function(){
        Deserialize.byType( 'vector<ustring>', Buffer.alloc(8), 0)
      })

      it('should int', function(){
        Deserialize.byType( 'int', Buffer.alloc(8), 0)
      })
    })
  })
})
