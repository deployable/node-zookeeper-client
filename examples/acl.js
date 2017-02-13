const zk = require('../index.js')
const client = zk.createClient(process.argv[2], { retries : 2 })
const path = process.argv[3]
const acls = [
  zk.ACL.ip('127.0.0.1', 'a')
]

client.connect().then(()=>{
  console.log('Connected to the server.')

  client.setACL(path, acls, stat => {
    console.log('ACL is set to: %j', acls)
    return client.getACL(path)
  })
  .then(res => {
    console.log('ACL of node: %s is: %j', res.path, acls)
    return client.close()
  })
  .catch(error => {
    console.log('There was an error with the ACL: %s.', error)
  })
  .finally(()=> client.close())
})

