const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]

let watcher = (event) => {
  console.log('Got event: %s', event)
  getData(zkpath)
}

function getData(node_path) {
  return client.getData(node_path).then(res => {
    console.log('Node: %s has data: %s, version: %d', node_path, res.data, res.stat.version)
  })
  .catch(error => {
    console.log('Error occurred when getting data: %s.', error)
  })
}

client.connect().then(()=> {
  console.log('Connected to ZooKeeper.')
  getData(zkpath)
})
.finally(()=> client.close())

