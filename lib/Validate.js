// # Validate

// Validate Zookeeper things.

const { ZkPathError } = require('./errors')


// ## class Validate

class Validate {

  // ### path(node_String)  

  // Validate a ZooKeeper path. Throws a `ZkPathError` on failure.
 
  static path(path) {
    if ( typeof path !== 'string' || path === '' )
      throw new ZkPathError('Node path must be a non-empty string')

    if ( !path.startsWith('/') )
      throw new ZkPathError(`Node path must start with a / character. ${path}`)

    // Shortcut, no need to check more since the path is the root.
    if ( path.length === 1 ) return 

    if ( path.endsWith('/') )
      throw new ZkPathError(`Node path must not end with a / character. ${path}`)

    if ( path.includes('//') )
      throw new ZkPathError(`Node path must not contain an empty node name. ${path}`)

    if ( path.includes('/./') || path.endsWith('/.') || 
         path.includes('/../') || path.endsWith('/..') )
      throw new ZkPathError(`Node path must not contain relative path(s). ${path}`)

    return path
  }

}


module.exports = {
  Validate,
  ZkPathError
}

