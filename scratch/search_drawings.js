process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const loginUrl = 'https://srvdms/identityprovider/login';
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const loginRes = await fetch(loginUrl, { headers });
    const allCookies = loginRes.headers.getSetCookie();
    let authSessionId = null;
    for (let c of allCookies) {
      if (c && c.includes('AuthSessionId=')) {
        authSessionId = c.match(/AuthSessionId=([^;]+)/)[1];
        break;
      }
    }
    
    const propParam = JSON.stringify({ "5": ["4778-0101-08"] });
    const objdefParam = JSON.stringify(["DADZ"]);
    
    const url = `https://srvdms/dms/r/4fd39dfc-d88d-541f-8bfb-839608941ed4/sr/?properties=${encodeURIComponent(propParam)}&objectdefinitionids=${encodeURIComponent(objdefParam)}`;
    console.log(`Searching: ${url}`);
    
    const reqHeaders = new Headers();
    reqHeaders.set('Accept', 'application/hal+json, application/json');
    reqHeaders.set('Cookie', `AuthSessionId=${authSessionId}`);
    
    const res = await fetch(url, { headers: reqHeaders });
    const data = await res.json();
    console.log('Results Count:', data.count);
    
    if (data.items && data.items.length > 0) {
      console.log('First Item Found:');
      console.log('  ID:', data.items[0].id);
      console.log('  DisplayName:', data.items[0].displayName);
      console.log('  ObjectDefinitionId:', data.items[0].objectDefinitionId);
      console.log('  Links:', JSON.stringify(data.items[0]._links, null, 2));
    } else {
      console.log('No items found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
