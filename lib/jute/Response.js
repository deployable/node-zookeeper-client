/**
 * This class represent the response that ZooKeeper sends back to the client.
 *
 * @class Responsee
 * @constructor
 * @param header {Record} The request header record.
 * @param payload {payload} The request payload record.
 */

class Response {

  constructor(header, payload) {
    this.header = header
    this.payload = payload
  }

}
