/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

let State = require('../lib/State')


describe('State', function(){

  describe('constants', function(){
  
    it('should have all defined states', function(){
      expect(State.CONNECTED).to.exist
      expect(State.CLOSED).to.exist
      expect(State.AUTH_FAILED).to.exist
      expect(State.CONNECTED_READ_ONLY).to.exist
      expect(State.EXPIRED_SESSION).to.exist

      //expect(State.SASL_AUTHENTICATED).to.exist

    })

  })

})
