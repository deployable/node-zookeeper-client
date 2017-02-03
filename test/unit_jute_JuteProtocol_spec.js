
const { JuteProtocol } = require('../lib/jute/Protocol')

let types = [
  'ConnectRequest',
  'ConnectResponse',
  'RequestHeader',
  'ReplyHeader',
  'AuthPacket',
  'CreateRequest',
  'CreateResponse',
  'DeleteRequest',
  'GetChildren2Request',
  'GetChildren2Response',
  'ExistsRequest',
  'ExistsResponse',
  'SetDataRequest',
  'SetDataResponse',
  'GetDataRequest',
  'GetDataResponse',
  'GetACLRequest',
  'GetACLResponse',
  'SetACLRequest',
  'SetACLResponse',
  'WatcherEvent',
  'SetWatches',
  'MultiHeader',
  'CheckVersionRequest',
  'ErrorResponse',
]

let types_with_data = [
  'CreateRequest',
  'GetChildren2Response'
]

describe('Unit::jute::JuteProtocol', function(){

  describe('class', function(){

    describe('.types', function(){

      it('should have a spec', function(){
        types.forEach(type => {
          expect( JuteProtocol.types[type].spec, type ).to.be.ok
        })
      })

      it('should have a spec attributes order', function(){
        types.forEach(type => {
          expect( JuteProtocol.types[type].spec.order, type ).to.be.ok
        })
      })

      it('should have spec attributes', function(){
        types.forEach(type => {
          expect( JuteProtocol.types[type].spec.attributes, type ).to.be.ok
        })
      })

    })

    describe('.create()', function(){

      it('should throw on missing type', function(){
        expect( JuteProtocol.create( 'ConnectResponse' ) ).to.be.ok
      })

      it('should create all the types', function(){
        types.forEach(type => {
          if (types_with_data.indexOf(type)) return
          expect( JuteProtocol.create(type) ).to.be.ok
        })
      })

    })


  })
})
