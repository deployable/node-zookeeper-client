// # Errors

class JuteError extends Error {
  
  constructor(message, options){
    super(message)
    this.name = this.constructor.name;
    ( Error.captureStackTrace ) 
      ? Error.captureStackTrace(this, this.constructor)
      : this.stack = (new Error(message)).stack
  }

}

class JuteTypeError extends JuteError {

  constructor( message, options = {} ){
    super(message, options)
    this.type = options.type
  }
  
}

module.exports = {
  JuteError,
  JuteTypeError
}
