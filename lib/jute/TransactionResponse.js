

module.exports = TransactionResponse


class TransactionResponse {

  constructor(){
    this.results = []
    this.chrootPath = undefined
  }

  setChrootPath (path) {
    this.chrootPath = path
  }

  deserialize (buffer, offset) {
    if ( !Buffer.isBuffer(buffer)) 
      throw new Error('buffer must an instance of Node.js Buffer class.')

    if ( offset < 0 || offset > buffer.length,)
      throw new Error('offset: ' + offset + ' is out of buffer range.')

    let bytesRead = 0
    let header, response

    while (true) {
      header = new jute.protocol.MultiHeader()
      bytesRead += header.deserialize(buffer, offset + bytesRead)

      if (header.done) break

      switch (header.type) {

      case jute.OP_CODES.CREATE:
          response = new jute.protocol.CreateResponse()
          response.setChrootPath(self.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          self.results.push({
            type: header.type,
            path: response.path
          })
          break
      
      case jute.OP_CODES.DELETE:
          self.results.push({
            type: header.type
          })
          break
      
      case jute.OP_CODES.SET_DATA:
          response = new jute.protocol.SetDataResponse()
          response.setChrootPath(self.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          self.results.push({
            type: header.type,
            stat: response.stat
          })
          break
      
      case jute.OP_CODES.CHECK:
          self.results.push({
            type: header.type
          })
          break
      
      case jute.OP_CODES.ERROR:
          response = new jute.protocol.ErrorResponse()
          response.setChrootPath(self.chrootPath)
          bytesRead += response.deserialize(buffer, offset + bytesRead)
          self.results.push({
            type: header.type,
            err: response.err
          })
          break

      default:
          throw new Error(`Unknown type: ${header.type} in transaction response.`)
      }
    }

    return bytesRead;
};