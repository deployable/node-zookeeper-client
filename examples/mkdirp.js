const zk = require('..')
const client = zk.createClient(process.argv[2] || 'localhost:2183')
const zkpath = process.argv[3]

client.connect().then(() => {
  console.log('Connected to the server')
  
  return client.mkdirp(zkpath, zk.CreateMode.PERSISTENT).then(stat => {
    console.log('Path "%s" successfully created', stat)
  })
  .catch(error => console.error(error.stack))
  .finally(() => client.close())
})

