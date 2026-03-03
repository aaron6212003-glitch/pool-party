import fetch from 'node-fetch';
const targetDate = process.argv[2] || '2026-03-02';
const token = process.env.SLING_AUTH_TOKEN;

async function run() {
    console.log('Fetching for', targetDate);
    const slingRes = await fetch(`https://api.getsling.com/v1/shifts?dates=${targetDate}&status=published`, {
        headers: { Authorization: token },
    });
    const data = await slingRes.text();
    console.log('Status', slingRes.status);
    console.log(data);
}
run();
