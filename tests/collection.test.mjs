import test from 'node:test';
import assert from 'node:assert/strict';
import {newsItem,rankHot} from '../scripts/collector.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const now=new Date('2026-11-11T06:00:00Z');
const source={id:'rss-test',name:'Test',owner_entity_id:'publisher'};
test('news keeps original dates, rejects missing/future dates and executable links',()=>{
 const candidate={title:'Nintendo Switch 2 revenue rises 40%',excerpt:'Quarterly financial report',url:'https://example.org/story',publishedAt:'2026-11-11T01:00:00Z'};
 const item=newsItem(candidate,source,now);assert.equal(item.at,'2026-11-11T01:00:00.000Z');assert.equal(item.participant,'owner:publisher');
 assert.equal(newsItem({...candidate,publishedAt:null},source,now),null);
 assert.equal(newsItem({...candidate,publishedAt:'2026-11-12T01:00:00Z'},source,now),null);
 assert.equal(newsItem({...candidate,url:'javascript:alert(1)'},source,now),null);
 assert.equal(newsItem({...candidate,title:'Weekend deals free play days'},source,now),null);
});
test('hot events expire and duplicate sources cannot manufacture heat',()=>{
 const row=(id,participant,hours)=>({id,participant,sourceId:participant,sourceName:participant,title:'Nintendo Switch 2 quarterly revenue rises 40%',summary:'Nintendo Switch 2 revenue rises 40% in the latest quarterly financial report.',at:new Date(+now-hours*3600000).toISOString()});
 assert.equal(rankHot([row('a','one',2),row('b','one',1)],now).length,0);
 const ranked=rankHot([row('a','one',2),row('b','two',1)],now);assert.equal(ranked.length,1);assert.equal(ranked[0].participants,2);
 assert.equal(rankHot([row('a','one',50),row('b','two',49)],now).length,0);
 assert(rankHot([row('a','one',22),row('b','two',21)],now)[0].heat<ranked[0].heat);
});
test('a rebuild preserves prior news and game identity without refreshing source timestamps',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'gamehot-static-test-'));
 const write=async(name,value)=>fs.writeFile(path.join(dir,name),typeof value==='string'?value:JSON.stringify(value));
 try{await fs.mkdir(path.join(dir,'data'));await fs.mkdir(path.join(dir,'web'));
 const at=new Date(Date.now()-86400000).toISOString();
 const news=id=>({id,title:'Game industry announcement '+id,summary:'Public excerpt',url:'https://example.org/'+id,sourceId:id,sourceName:id,participant:id,at,category:'games',tags:[]});
 const game={id:'6737595599',name:'Foundation: Galactic Frontier',rank:1,publisher:'FunPlus',url:'https://apps.apple.com/us/app/id6737595599',tags:[],image:''};
 const chart={id:'apple-us-slg-grossing',source:'App Store',scope:'overseas',platform:'ios',market:'us',marketName:'美国',category:'slg',categoryName:'SLG',metric:'grossing',metricName:'畅销榜',capturedAt:at,sourceUpdatedAt:at,count:1,games:[game]};
 await write('data/seed.json',{version:1,news:[news('seed')],steam:{games:[{appId:570}],capturedAt:at},mobile:{charts:[chart],refreshedAt:at},profiles:{games:{},capturedAt:at}});
 await write('data/news.json',[news('persisted')]);await write('data/sources.json',{sources:[]});await write('data/topics.json',{topics:[]});await write('web/index.html','<!doctype html><title>GameHOT</title>');
 execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/collector.mjs',import.meta.url)),'--build'],{cwd:dir,env:{...process.env,COLLECT_ENABLED:'false',GITHUB_ACTIONS:'',GAMEHOT_PREVIOUS_URL:''},stdio:'pipe'});
 const n=JSON.parse(await fs.readFile(path.join(dir,'site/data/news.json'))),d=JSON.parse(await fs.readFile(path.join(dir,'site/data/games/apple-us-6737595599.json')));
 assert.equal(n.items.length,2);assert.equal(n.status.automationEnabled,false);assert.equal(d.game.id,game.id);assert.equal(d.rankings[0].capturedAt,at);assert.equal(d.website.url,'https://www.foundation.game/en');
 }finally{if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'gamehot-static-test-'))throw Error('Unexpected temporary directory');await fs.rm(dir,{recursive:true,force:true});}
});
