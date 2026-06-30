async function main() {
  const url = 'http://localhost:5000/api/machines';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Machines:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
main();
