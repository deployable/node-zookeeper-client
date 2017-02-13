const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]

client.connect().then(()=>{
  console.log('Connected to the server.')
  client.remove(zkpath).then(res => {
    console.log('Node: %s is deleted.', zkpath)
  })
  .catch(error => {
    console.log('Failed to delete node: %s due to: %s.', zkpath, error)
  })
  .finally(() => client.close())
})

