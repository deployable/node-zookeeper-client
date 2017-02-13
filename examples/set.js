const zk = require('..')
const client = zk.createClient(process.argv[2], { retries : 2 })
const zkpath = process.argv[3]
const data = Buffer.from(process.argv[4])

console.log('Setting %s on %s to "%s"', client.connManager.connectionString.getConnectionString(), zkpath, data.toString())
client.connect().then(() => {
  console.log('Connected to the server.')

  return client.setData(zkpath, data).then(stat => {
    console.log('Set data "%s" on node %s, version: %d.', data, zkpath, stat.version)
  })
  .finally(()=> client.close())
})


