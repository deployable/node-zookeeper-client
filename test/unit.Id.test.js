/**
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 *
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file
 * for terms.
 */

const {Id} = require('../lib/Id')


describe('Unit::Id', function () {

  it('create', function () {
    expect( new Id('world','anyone') ).to.be.ok
  })

  it('world', function () {
    expect( Id.world('some.com') ).to.be.ok
  })

  it('auth', function () {
    expect( Id.auth('someauth') ).to.be.ok
  })

  it('digest', function () {
    expect( Id.digest('someauth') ).to.be.ok
  })

  it('host', function () {
    expect( Id.host('some.com') ).to.be.ok
  })

  it('ip', function () {
    expect( Id.ip('127.0.0.1') ).to.be.ok
  })

})
