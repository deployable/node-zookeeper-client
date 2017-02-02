
const Transaction = require('../lib/Transaction')
const ConnectionManager = require('../lib/ConnectionManager')

describe('Transaction', function(){

  describe('instance', function(){

    describe('setup', function(){

      it('should create a Transaction instance', function () {
        let cm = new ConnectionManager('test', {}, ()=>{})
        expect( new Transaction(cm) ).to.be.an.instanceof( Transaction )
      })
    })


    describe('methods', function(){

      let trans = null
      let cm = null

      before(function(){
        cm = new ConnectionManager('test', {}, ()=>{})
        trans = new Transaction(cm)
      })

      it('should create', function () {
        expect( trans.create('/') ).to.equal( trans )
      })

      it('should check', function () {
        expect( trans.check('/') ).to.equal( trans )
      })

      it('should setData', function () {
        expect( trans.setData('/', undefined) ).to.equal( trans )
      })

      it('should remove', function () {
        expect( trans.remove('/', undefined) ).to.equal( trans )
      })

      // Functional
      xit('should commit', function (done) {
        this.timeout(10000)
        let cb = (err, res) => {
          expect( err ).to.be.null
          expect( res ).to.eql({})
          done()
        }
        expect( trans.commit(cb) ).to.be.undefined
      })

    })
  })
})
