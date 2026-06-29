const dgram = require('dgram');

function probe() {
  const client = dgram.createSocket('udp4');
  const message = Buffer.from([0x02]); // CLNT_UCAST_INST request
  
  console.log('Sending SQL Browser probe to 192.168.100.8:1434...');
  
  client.on('message', (msg, rinfo) => {
    console.log(`Received response from ${rinfo.address}:${rinfo.port}:`);
    console.log(msg.toString('ascii'));
    client.close();
    process.exit(0);
  });

  client.on('error', (err) => {
    console.error('Socket error:', err);
    client.close();
    process.exit(1);
  });

  // Set timeout
  setTimeout(() => {
    console.log('Timeout. SQL Browser service did not respond (probably disabled or blocked by firewall).');
    client.close();
    process.exit(0);
  }, 4000);

  client.send(message, 1434, '192.168.100.8');
}

probe();
