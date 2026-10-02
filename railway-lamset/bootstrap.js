const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const p0 = fs.readFileSync(path.join(__dirname, 'app.b64.0'), 'utf8').trim();
const p1 = fs.readFileSync(path.join(__dirname, 'app.b64.1'), 'utf8').trim();
const packed = Buffer.from(p0 + p1, 'base64');
let source = zlib.gunzipSync(packed).toString('utf8');

// Luxury Riyadh palette: charcoal + warm ivory + bronze gold + stone beige.
// Applied at boot so the packaged app stays intact while the visual identity is easy to tune.
const palette = [
  ['#fbfaf7', '#f7f3ed'],
  ['#171717', '#1a1816'],
  ['#d8b16b', '#d8ad61'],
  ['#c9a15b', '#c79746'],
  ['#f1e8d5', '#efe3d0'],
  ['#745521', '#704b19'],
  ['#f3f0e9', '#f0eae1'],
  ['#090909', '#0b0a09'],
  ['#111111', '#161412'],
  ['#111', '#161412']
];
for (const [from, to] of palette) source = source.split(from).join(to);

const needle = "if(p==='/admin/setup'){";
if (!source.includes(needle)) throw new Error('Admin setup route patch target not found');
source = source.replace(
  needle,
  needle + "let setupToken=process.env.SETUP_TOKEN||'';if(setupToken&&u.searchParams.get('token')!==setupToken)return send(res,404,'Not Found');"
);

const target = path.join('/tmp', 'lamset-server.js');
fs.writeFileSync(target, source);
require(target);
