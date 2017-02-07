const debug = require('debug')('dply:test:unit:jute:ZkJuteProtocol')

const { ZkJuteData,
      ZkJuteProtocol } = require('../lib/jute/Protocol')

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
  'GetChildren2Response',
  'GetACLResponse',
  'SetACLRequest',

]

describe('Unit::jute::ZkJuteProtocol', function(){

  describe('class', function(){

    describe('.types', function(){

      it('should have a spec', function(){
        types.forEach(type => {
          expect( ZkJuteProtocol[type].spec, type ).to.be.ok
        })
      })

      it('should have a spec attributes order', function(){
        types.forEach(type => {
          expect( ZkJuteProtocol[type].spec.order, type ).to.be.ok
        })
      })

      it('should have spec attributes', function(){
        types.forEach(type => {
          expect( ZkJuteProtocol[type].spec.attributes, type ).to.be.ok
        })
      })

    })

    describe('.create()', function(){

      it('should throw on missing type', function(){
        expect( ZkJuteProtocol.create( 'ConnectResponse' ) ).to.be.ok
        let fn = () => ZkJuteProtocol.create( 'ConnectRespons' )
        expect( fn ).to.be.ok
      })

      it('should create all the types', function(){
        types.forEach(type => {
          debug('type', type)
          if (types_with_data.indexOf(type) !== -1 ) return
          expect( ZkJuteProtocol.create(type) ).to.be.ok
        })
      })

    })


  })


  describe('ZkJuteData', function(){

    describe('Id', function(){

      it('should create an Id Data', function(){
        let data = ZkJuteData.JuteDataZkId.create('dscheme', 'did')
        expect( data.scheme.value).to.eql( 'dscheme' )
        expect( data.id.value ).to.eql( 'did' )
      })

      it('should serialize', function(){
        let buf = new Buffer(20).fill(0)
        let dataId = ZkJuteData.JuteDataZkId.create('oneaa', 'twobbb')
        // 4+5 + 4+6 
        dataId.serialize(buf, 0)
        let res = Buffer.from(
          [0,0,0,5,111,110,101,97,97,0,0,0,6,116,119,111,98,98,98,0]
        )
        expect( buf ).to.eql( res )
      })

      it('should deserialize', function(){
        let buf = Buffer.from([0,0,0,3,111,111,111,0,0,0,2,116,116,255])
        let jdId = ZkJuteData.JuteDataZkId.create()
        jdId.deserialize(buf, 0)
        expect(jdId.scheme.value).to.equal('ooo')
        expect(jdId.id.value).to.equal('tt')
        expect(jdId.bytes).to.equal(13)
        expect(jdId.byteLength()).to.equal(13)
      })

    })


  })
})
