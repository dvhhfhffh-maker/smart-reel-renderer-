const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const p0 = fs.readFileSync(path.join(__dirname, 'app.b64.0'), 'utf8').trim();
const p1 = fs.readFileSync(path.join(__dirname, 'app.b64.1'), 'utf8').trim();
const packed = Buffer.from(p0 + p1, 'base64');
let source = zlib.gunzipSync(packed).toString('utf8');

// Luxury Riyadh palette: charcoal + warm ivory + bronze gold + stone beige.
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

// Premium section rhythm and card hierarchy.
const luxuryLayoutCSS = `
:root{--gold:#c79746;--gold2:#d8ad61;--ink:#161412;--ivory:#f7f3ed;--stone:#f0eae1;--line:#e4dacb;--soft:#fffdf9}
body{background:var(--ivory)}
.container{width:min(1180px,92%);margin-inline:auto}
.section{padding:92px 0;position:relative}
.section>.container{position:relative}
.head{max-width:780px;margin:0 auto 42px;text-align:center}
.head .tag{margin-bottom:12px}
.head h2{line-height:1.25;letter-spacing:-.02em}
.head p{max-width:660px;margin:12px auto 0}
.head:after{content:"";display:block;width:72px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--gold),var(--gold2));margin:20px auto 0}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-items:stretch}
.card{height:100%;border:1px solid var(--line);border-radius:24px;background:rgba(255,255,255,.88);box-shadow:0 14px 40px rgba(22,20,18,.07);transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
.card:hover{transform:translateY(-6px);box-shadow:0 22px 55px rgba(22,20,18,.12);border-color:rgba(199,151,70,.55)}
.card .pad{padding:24px}
.card h3{margin-top:0;margin-bottom:10px;line-height:1.45}
.card p{margin-bottom:18px}
.card img{height:235px;object-fit:cover}
#services{background:linear-gradient(180deg,var(--ivory),#fffdf9)}
#services .card{position:relative;overflow:hidden}
#services .card:before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold2));z-index:2}
#portfolio{background:var(--stone)!important}
#portfolio .portfolio{columns:auto!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
#portfolio .port{margin:0!important;break-inside:auto;border:1px solid rgba(199,151,70,.2);box-shadow:0 14px 34px rgba(22,20,18,.09);min-height:290px}
#portfolio .port img{height:100%;min-height:290px;object-fit:cover}
.filters{gap:10px;margin-bottom:28px}
.filters button{font:inherit;color:var(--ink);cursor:pointer;border:1px solid #d9cfbf;padding:9px 15px;transition:.2s}
.filters button:hover{border-color:var(--gold);background:#fff8eb}
#before{background:#fffdf9}
.ba{height:360px;border:1px solid var(--line);box-shadow:0 16px 42px rgba(22,20,18,.09)}
.ba+h3{margin:16px 4px 0}
.why{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.why div{min-height:115px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-weight:750}
.stats{padding:70px 0;background:linear-gradient(135deg,#12100f,#211b16)}
.statgrid{gap:16px}
.stat{background:rgba(255,255,255,.035);backdrop-filter:blur(6px);min-height:128px;display:grid;place-items:center;align-content:center}
.stat b{line-height:1.1;margin-bottom:7px}
.testimonials{gap:22px}
.testimonials .card{background:#fffdf9}
.testimonials .pad{padding:28px}
#about{position:relative;overflow:hidden}
#about:after{content:"";position:absolute;width:340px;height:340px;border-radius:50%;background:rgba(199,151,70,.08);left:-140px;top:-120px;pointer-events:none}
.quote{padding:90px 0;background:linear-gradient(135deg,#15120f,#2a2119)}
.quote .container{max-width:1020px}
.quote form{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.11);border-radius:26px;padding:28px;box-shadow:0 25px 70px rgba(0,0,0,.2)}
.formgrid{gap:16px}
input,select,textarea{border-color:#d8ccb9;transition:border-color .2s,box-shadow .2s}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(199,151,70,.13)}
.footer{padding-top:64px}
.foot{gap:42px}
.btn{min-height:46px;box-shadow:0 8px 22px rgba(199,151,70,.16);transition:transform .2s ease,box-shadow .2s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(199,151,70,.24)}
@media(max-width:900px){
 .section{padding:72px 0}
 .grid,.why,.testimonials{grid-template-columns:repeat(2,minmax(0,1fr))}
 #portfolio .portfolio{grid-template-columns:repeat(2,minmax(0,1fr))}
 .head{margin-bottom:32px}
}
@media(max-width:620px){
 .container{width:min(94%,1180px)}
 .section{padding:56px 0}
 .grid,.why,.testimonials,#portfolio .portfolio,.statgrid{grid-template-columns:1fr!important}
 .card{border-radius:20px}
 .card img{height:210px}
 #portfolio .port img{min-height:235px}
 .ba{height:290px}
 .quote{padding:60px 0}
 .quote form{padding:18px;border-radius:20px}
 .head h2{font-size:clamp(1.65rem,8vw,2.15rem)}
}
`;

const styleNeedle = '<style>' + '$' + '{CSS}</style>';
const styleReplacement = '<style>' + '$' + '{CSS}</style><style>' + luxuryLayoutCSS + '</style>';
if (!source.includes(styleNeedle)) throw new Error('Layout style injection target not found');
source = source.replace(styleNeedle, styleReplacement);

const needle = "if(p==='/admin/setup'){";
if (!source.includes(needle)) throw new Error('Admin setup route patch target not found');
source = source.replace(
  needle,
  needle + "let setupToken=process.env.SETUP_TOKEN||'';if(setupToken&&u.searchParams.get('token')!==setupToken)return send(res,404,'Not Found');"
);

const target = path.join('/tmp', 'lamset-server.js');
fs.writeFileSync(target, source);
require(target);
