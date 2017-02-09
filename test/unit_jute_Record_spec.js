
const {Record} = require('../lib/jute/Record')


describe('Unit::Record', function(){

  describe('instance', function(){

    class AType {
      constructor(value){
        this.value = value
      }
      get value(){ return this._value }
      set value(val){ this._value = val }
    }
    class Whatever extends Record {
      constructor(first, second){
        super(arguments)
        this.first = first
        this.second = second
      }
      get first(){ return this._first }
      set first(val){ this._first = val }
      get second(){ return this._second }
      set second(val){ this._second = val }
    }
    Whatever.spec = {
      order: [ 'first', 'second' ],
      attributes: {
        first: { type: Number },
        second: { type: AType }
      }
    }

    describe('Whatever', function(){

      let whatever = null

      before(function(){
        whatever = new Whatever(new AType(5), new AType('narg'))
      })

      it('should hae first attached', function () {
        expect( whatever.first ).to.be.ok
      })

      it('should hae first attached', function () {
        expect( whatever.first.value ).to.equal( 5 )
      })

      it('should have second attached', function () {
        expect( whatever.second ).to.be.ok
      })

      it('should have second equal to narg', function () {
        expect( whatever.second.value ).to.equal( 'narg' )
      })

      it('should have second equal to narg', function () {
        expect( whatever.toJS() ).to.eql( {
          first: 5,
          second: 'narg'
        })
      })

    })
  })
})
