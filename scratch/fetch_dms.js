async function main() {
  const url = 'http://192.168.100.8:8081/d4softwaresources/sources/index.json';
  console.log(`Fetching ${url} using native fetch...`);
  
  try {
    const res = await fetch(url);
    console.log('Success without auth! Status:', res.status);
    const data = await res.json();
    console.log('Data sample:', JSON.stringify(data).slice(0, 1000));
  } catch (err) {
    console.log('Failed without auth. Trying with Basic Auth (rr\\simon / 88171)...');
    try {
      const headers = new Headers();
      headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));
      
      const res = await fetch(url, { headers });
      console.log('Success with basic auth! Status:', res.status);
      const data = await res.json();
      console.log('Data sample:', JSON.stringify(data).slice(0, 1000));
    } catch (err2) {
      console.error('Failed with basic auth too. Error:', err2.message);
    }
  }
}

main();
