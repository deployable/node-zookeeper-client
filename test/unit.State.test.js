/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

let State = require('../../lib/State')


describe('State', function(){

  describe('constants', function(){
  
    it('should have all defined states', function(){
      expect(State.STATES.SYNC_CONNECTED).to.exist
      expect(State.STATES.DISCONNECTED).to.exist
      expect(State.STATES.AUTH_FAILED).to.exist
      expect(State.STATES.CONNECTED_READ_ONLY).to.exist
      expect(State.STATES.SASL_AUTHENTICATED).to.exist
      expect(State.STATES.EXPIRED).to.exist
    })

  })

})
