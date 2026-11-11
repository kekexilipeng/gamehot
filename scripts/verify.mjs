import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read=async p=>JSON.parse(await fs.readFile('site/data/'+p,'utf8'));
const n=await read('news.json'),s=await read('steam.json'),catalog=await read('mobile.json');
assert(n.items.length>0&&s.games.length>0&&catalog.length>0,'Empty site');
const now=Date.now();for(const item of n.items){assert(Date.parse(item.at)<=now,'Future article');assert(/^https?:\/\//.test(item.url),'Bad article link');}
const checked=new Set();let charts=0,details=0;
for(const c of catalog){const chart=await read('charts/'+c.id+'.json');assert.equal(chart.games.length,c.count);charts++;
 for(const game of chart.games){const key=`${c.source==='App Store'?'apple':'tap'}-${c.market}-${game.id}`;if(checked.has(key))continue;checked.add(key);const detail=await read('games/'+key+'.json');assert.equal(detail.game.id,game.id);assert.equal(detail.market,c.market);if(detail.profile)assert.equal(detail.profile.id,game.id);details++;}}
for(const name of ['index.html','app.css','app.js'])assert((await fs.stat('site/'+name)).size>0);
console.log(JSON.stringify({news:n.items.length,hot:n.hot.length,steam:s.games.length,charts,details,verified:true}));
