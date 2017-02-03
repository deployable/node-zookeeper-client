class ZkError extends Error {
  constructor( message ){
    super(message)
    this.name = this.constructor.name;
    ( Error.captureStackTrace ) 
      ? Error.captureStackTrace(this, this.constructor)
      : this.stack = (new Error(message)).stack
  }
}

class ZkTypeError extends ZkError {
  constructor( message, options = {} ){
    super(message, options)
    this.type = options.type
    this.value = options.value
  }
}

module.exports = {
  ZkError,
  ZkTypeError
}
