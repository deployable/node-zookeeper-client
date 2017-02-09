/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {ACL} = require('../lib/ACL')


describe('Unit::ACL', function () {

  it('create', function () {
    expect( new ACL('r', ['world','anyone']) ).to.be.ok
    expect( new ACL('all', ['world','anyone']) ).to.be.ok
  })

  it('world', function () {
    expect( ACL.world('rwc') ).to.be.ok
  })

  it('auth', function () {
    expect( ACL.auth('somename', 'rw') ).to.be.ok
  })

  it('digest', function () {
    expect( ACL.digest('', 'w') ).to.be.ok
  })

  it('host', function () {
    expect( ACL.host('host.me.com', 'c') ).to.be.ok
  })

  it('ip', function () {
    expect( ACL.ip('127.0.0.1', 'd') ).to.be.ok
  })

})
