const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const p0 = fs.readFileSync(path.join(__dirname, 'app.b64.0'), 'utf8').trim();
const p1 = fs.readFileSync(path.join(__dirname, 'app.b64.1'), 'utf8').trim();
const packed = Buffer.from(p0 + p1, 'base64');
let source = zlib.gunzipSync(packed).toString('utf8');

const needle = "if(p==='/admin/setup'){";
if (!source.includes(needle)) throw new Error('Admin setup route patch target not found');
source = source.replace(
  needle,
  needle + "let setupToken=process.env.SETUP_TOKEN||'';if(setupToken&&u.searchParams.get('token')!==setupToken)return send(res,404,'Not Found');"
);

const target = path.join('/tmp', 'lamset-server.js');
fs.writeFileSync(target, source);
require(target);
