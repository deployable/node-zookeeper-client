const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]

function watcher (event) {
  console.log('Got event: %s.', event);
  exists(client, zkpath);
}

function exists(client, node_path) {
  return client.exists(node_path, {watcher: watcher}).then(stat => {
    if (stat) {
      console.log('Node: %s exists and its version is: %j', node_path, stat.version)
    } else {
      console.log('Node %s does not exist.', node_path)
    }
  })
  .catch(error => {
    console.log('Failed to check existence of node: %s due to: %s.', node_path, error.stack)
  })
  .finally(() => client.close())
}

client.connect().then(() => {
  console.log('Connected to ZooKeeper.')
  exists(client, zkpath)
})

