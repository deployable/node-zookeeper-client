// Constants.
const CLIENT_DEFAULT_OPTIONS = {
  sessionTimeout: 30000, // Default to 30 seconds.
  spinDelay: 1000, // Defaults to 1 second.
  retries: 0 // Defaults to 0, no retry.
}

const DATA_SIZE_LIMIT = 1048576 // 1 mega bytes.

const DEFAULT_PORT = 2181
            
module.exports = { CLIENT_DEFAULT_OPTIONS, DATA_SIZE_LIMIT, DEFAULT_PORT }
