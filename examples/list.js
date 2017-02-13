const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]

function listChildren(node_path) {
  let watcher = (event) => {
    console.log('Got watcher event: %s', event)
    listChildren(node_path)
  }
  return client.getChildren(node_path, { watcher: watcher }).then(res => {
    console.log('Children of node: %s are: %j.', node_path, res.children)
  })
  .catch(error => {
    console.log('Failed to list children of node: %s due to: %s.', node_path, error.stack)
  })
  .finally(() => client.close())
}

client.connect().then(() => {
  console.log('Connected to ZooKeeper.')
  listChildren(zkpath)
})

