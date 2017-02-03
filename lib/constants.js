// Constants.
const CLIENT_DEFAULT_OPTIONS = {
  sessionTimeout: 30000, // Default to 30 seconds.
  spinDelay: 1000, // Defaults to 1 second.
  retries: 0 // Defaults to 0, no retry.
}

const DATA_SIZE_LIMIT = 1048576 // 1 mega bytes.

const DEFAULT_PORT = 2181

const CREATE_MODES = {

  /**
   * The znode will not be automatically deleted upon client's disconnect.
   */
  PERSISTENT: 0,

  /**
  * The znode will not be automatically deleted upon client's disconnect,
  * and its name will be appended with a monotonically increasing number.
  */
  PERSISTENT_SEQUENTIAL: 2,

  /**
   * The znode will be deleted upon the client's disconnect.
   */
  EPHEMERAL: 1,

  /**
   * The znode will be deleted upon the client's disconnect, and its name
   * will be appended with a monotonically increasing number.
   */
  EPHEMERAL_SEQUENTIAL: 3
}

            
module.exports = { 
  CLIENT_DEFAULT_OPTIONS,
  DATA_SIZE_LIMIT,
  DEFAULT_PORT,
  CREATE_MODES
}
