
const { Serialize } = require('../lib/jute/Serialize')


describe('Unit::Jute::Serialize', function(){

  describe('class', function(){

    describe('.int()', function(){

      it('should run', function(){
        Serialize.int(1, Buffer.alloc(4), 0)
      })
    })

    describe('.long()', function(){

      it('should run', function(){
        Serialize.long(Buffer.from([0]), Buffer.alloc(8), 0)
      })
    })

    describe('.buffer()', function(){

      it('should run', function(){
        Serialize.buffer(undefined, Buffer.alloc(8), 0)
      })
    })

    describe('.ustring()', function(){

      it('should run', function(){
        Serialize.ustring(undefined, Buffer.alloc(8), 0)
      })
    })

    describe('.boolean()', function(){

      it('should run', function(){
        Serialize.boolean(false, Buffer.alloc(4), 0)
      })
    })

    describe('.vector()', function(){

      it('should run', function(){
        Serialize.vector('ustring', Buffer.from([0]), Buffer.alloc(4), 0)
      })
    })

    describe('.data()', function(){

      it('should run', function(){
        let mock_record = { serialize: sinon.spy() }
        Serialize.data(mock_record, Buffer.alloc(4), 0)
      })
    })


    describe('.byType()', function(){

      it('should run vector', function(){
        Serialize.byType( 'vector<ustring>', Buffer.from([0]), Buffer.alloc(8), 0)
      })

      it('should run int', function(){
        Serialize.byType( 'int', Buffer.from([0]), Buffer.alloc(8), 0)
      })
    })
  })
})
