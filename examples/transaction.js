const zk = require('..')
const client = zk.createClient(process.argv[2] || 'localhost:2181')

client.connect().then(() => {
  console.log('Connected to the server')

  return client.transaction()
    .create('/txn')
    .create('/txn/1', Buffer.from('transaction'))
    .setData('/txn/1', Buffer.from('test'), { version: -1 })
    .check('/txn/1')
    .remove('/txn/1', -1)
    .remove('/txn')
    .commit()
    .then(results => console.log('Transaction completed', results))
    .catch(error => console.log('Failed to execute the transaction: %s, results: %j', error.stack, error.results))
})
.finally(() => client.close())

