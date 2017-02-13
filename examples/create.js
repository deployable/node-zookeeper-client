const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]

client.connect().then(() => {
  console.log('Connected to the server.')

  client.create(zkpath).then(()=> {
    console.log('Node: %s is successfully created.', zkpath)
  })
  .catch(error => {
    console.log('Failed to create node: %s due to: %s.', zkpath, error)
  })
  .finally(()=> client.close())

})

