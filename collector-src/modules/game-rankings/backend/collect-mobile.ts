import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { config } from "@aihot/backend/config";
import { APPLE_CATEGORIES, APPLE_METRICS, MOBILE_MARKETS, type MobileChart, type MobileGame, type MobileSnapshot } from "../mobile-contracts.ts";
import { deriveSlgChart } from "../slg.ts";

export const TAP_CHARTS = [
  {category:"all",name:"全部游戏",metric:"hot",metricName:"热门榜",path:"/top/download",title:"热门榜"},
  {category:"all",name:"全部游戏",metric:"reserve",metricName:"预约榜",path:"/top/reserve",title:"预约榜"},
  {category:"all",name:"全部游戏",metric:"played",metricName:"热玩榜",path:"/top/played",title:"热玩榜"},
  {category:"all",name:"全部游戏",metric:"new",metricName:"新品榜",path:"/top/download/new",title:"新品榜"},
  {category:"all",name:"全部游戏",metric:"sell",metricName:"热卖榜",path:"/top/sell",title:"热卖榜"},
  ...[
    ["strategy","策略","策略榜"],["action","动作","动作榜"],
    ["idle","放置","放置榜"],["casual","休闲","休闲榜"],
    ["simulation","模拟经营","模拟经营榜"],["puzzle","益智解谜","解谜榜"],
    ["shooter","射击","射击榜"],["multiplayer","多人对战","多人对战榜"],
    ["acgn","二次元","二次元榜"],["music","音乐","音乐节奏榜"],
    ["roguelike","Roguelike","Roguelike榜"],
  ].map(([category,name,title])=>({category,name,title,metric:"hot",metricName:"热门榜",path:`/top/download/${category==="simulation"?"management":category==="puzzle"?"unriddle":category}`})),
];
interface Job { id:string; run:()=>Promise<MobileChart> }
async function response(url:string) {
  const r=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{"User-Agent":"GameHOTBot/1.0",Accept:"application/json,text/html"}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return r;
}
function safeUrl(value:unknown,host:string):string {
  const url=new URL(String(value));
  if(url.protocol!=="https:"||url.hostname!==host)throw new Error("榜单链接域名无效");
  return url.href;
}
function shortExcerpt(value:unknown):string {
  if(typeof value!=="string")return "";
  const plain=value.replace(/\s+/g," ").trim();
  const excerpt=/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(plain)?[...plain].slice(0,40).join(""):plain.split(" ").slice(0,24).join(" ");
  return excerpt+(excerpt.length<plain.length?"…":"");
}

/** Feed array order is Apple's category ranking, never a filtered global chart. */
export function parseAppleChart(raw:any, market:typeof MOBILE_MARKETS[number], category:typeof APPLE_CATEGORIES[number], metric:typeof APPLE_METRICS[number], sourceUrl:string):MobileChart {
  const feed=raw?.feed;
  if(!Array.isArray(feed?.entry)||!feed.entry.length||!Number.isFinite(Date.parse(feed.updated?.label)))throw new Error("Apple 榜单为空或结构无效");
  const seen=new Set<string>();
  const games:MobileGame[]=feed.entry.slice(0,50).map((e:any,i:number)=>{
    const id=String(e.id?.attributes?.["im:id"]??"");
    const name=e["im:name"]?.label;
    if(!/^\d+$/.test(id)||typeof name!=="string"||!name||seen.has(id))throw new Error("Apple 榜单条目无效");
    seen.add(id);
    const amount=Number(e["im:price"]?.attributes?.amount);
    const image=e["im:image"]?.at(-1)?.label;
    return {id,name,rank:i+1,publisher:e["im:artist"]?.label??"",image:typeof image==="string"&&image.startsWith("https://")?image:"",
      url:safeUrl(e.id.label,"apps.apple.com"),tags:category.id==="all"?[]:[category.name],
      priceLabel:amount===0?"免费下载":e["im:price"]?.label??"",intro:shortExcerpt(e.summary?.label),
      ...(Number.isFinite(Date.parse(e["im:releaseDate"]?.label))?{releaseDate:e["im:releaseDate"].label}:{})};
  });
  return {id:`apple-${market.id}-${category.id}-${metric.id}`,scope:market.scope,platform:"ios",market:market.id,marketName:market.name,
    category:category.id,categoryName:category.name,metric:metric.id,metricName:metric.name,source:"App Store",sourceUrl,
    capturedAt:new Date().toISOString(),sourceUpdatedAt:feed.updated.label,
    description:`Apple ${market.name}区 iPhone ${category.name}${metric.name}，保留官方订阅的前 50 名（不足 50 时按实际返回数量）。${metric.id==="grossing"?"畅销名次不等于具体收入，来源未提供营收金额。":"榜序不代表下载量数值，来源未提供下载量。"}${category.id==="strategy"?"此分类对应 Apple Strategy，包含 SLG 及其他策略玩法，并非仅 4X SLG。":""}${category.id==="simulation"?"此分类对应 Apple Simulation，包含模拟经营及其他模拟玩法。":""}`,
    count:games.length,refreshFailed:false,games};
}

/** Each page also renders neighboring charts: select the titled column, not every card on the page. */
export function parseTapChart(html:string, spec:typeof TAP_CHARTS[number]):MobileChart {
  const $=load(html);
  const column=$(".ranking-column").filter((_,e)=>$(e).find(".ranking-column__title").text().trim()===spec.title).first();
  const seen=new Set<string>();
  const games:MobileGame[]=column.find("a.ranking-card").map((_,e)=>{
    const card=$(e), href=card.attr("href")??"";
    const id=/\/app\/(\d+)/.exec(href)?.[1]??"";
    const name=card.find(".ranking-card__title").text().trim();
    const rank=Number(card.find(".ranking-card__rank-number").text());
    const rating=Number(card.find(".tap-rating__number").text());
    if(!id||!name||!Number.isInteger(rank)||rank<1||seen.has(id))throw new Error("TapTap 榜单条目无效");
    seen.add(id);
    const image=card.find("img").attr("src")??"";
    return {id,name,rank,publisher:"",image:image.startsWith("https://")?image:"",url:safeUrl(new URL(href,"https://www.taptap.cn").href,"www.taptap.cn"),
      tags:card.find('[itemprop="genre"]').map((_,t)=>$(t).text().trim()).get(),...(rating>0&&rating<=10?{rating}:{})};
  }).get();
  if(!games.length||games[0].rank!==1||games.some((g,i)=>g.rank!==i+1))throw new Error(`TapTap ${spec.title}缺少连续榜序`);
  return {id:`tap-${spec.category}-${spec.metric}`,scope:"domestic",platform:"android",market:"cn",marketName:"中国大陆",
    category:spec.category,categoryName:spec.name,metric:spec.metric,metricName:spec.metricName,source:"TapTap",sourceUrl:`https://www.taptap.cn${spec.path}`,
    capturedAt:new Date().toISOString(),sourceUpdatedAt:null,
    description:`TapTap 安卓${spec.title}公开页面前 ${games.length} 名。来源说明：${column.find(".ranking-column__footer-text").text().trim()}。本页显示采集快照，仅代表 TapTap 平台，评分为玩家评分，不是排名依据。${spec.category==="strategy"?"策略分类包含 SLG 及其他策略玩法。":""}`,
    count:games.length,refreshFailed:false,games};
}
export function mobileCollectionJobs():Job[] {
  const jobs:Job[]=[];
  for(const market of MOBILE_MARKETS)for(const category of APPLE_CATEGORIES)for(const metric of APPLE_METRICS){
    const url=`https://itunes.apple.com/${market.id}/rss/${metric.feed}/limit=50/genre=${category.appleId}/json`;
    jobs.push({id:`apple-${market.id}-${category.id}-${metric.id}`,run:async()=>parseAppleChart(await(await response(url)).json(),market,category,metric,url)});
  }
  for(const spec of TAP_CHARTS)jobs.push({id:`tap-${spec.category}-${spec.metric}`,run:async()=>parseTapChart(await(await response(`https://www.taptap.cn${spec.path}`)).text(),spec)});
  return jobs;
}
/** Refreshes are explicit or worker-driven. Keep each failed source's previous timestamp and rows. */
export async function collectMobileRankings(destination?:string,jobs=mobileCollectionJobs()) {
  const useBundled=destination===undefined;
  destination??=path.join(config.dataDir,"mobile-rankings.json");
  let previous:MobileSnapshot|undefined;
  try{previous=JSON.parse(await readFile(destination,"utf8"));}catch(e){
    if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
    if(useBundled)previous=JSON.parse(await readFile(new URL("../data/mobile-initial.json",import.meta.url),"utf8"));
  }
  const charts=new Map(previous?.charts.map(c=>[c.id,c])??[]);
  const failures:Array<{id:string;error:string}>=[];
  let next=0, updated=0;
  async function worker(){while(next<jobs.length){const job=jobs[next++];try{charts.set(job.id,await job.run());updated++;}catch(e){failures.push({id:job.id,error:e instanceof Error?e.message:String(e)});const old=charts.get(job.id);if(old)charts.set(job.id,{...old,refreshFailed:true});}}}
  await Promise.all([worker(),worker(),worker(),worker()]);
  if(!updated)throw new Error(`所有手游榜单刷新失败，保留原快照：${failures[0]?.error??"无采集任务"}`);
  for(const parent of [...charts.values()].filter(c=>c.source==="App Store"&&c.category==="strategy")){
    const slg=deriveSlgChart(parent);
    if(slg)charts.set(slg.id,slg);else charts.delete(`apple-${parent.market}-slg-${parent.metric}`);
  }
  const snapshot:MobileSnapshot={version:1,refreshedAt:new Date().toISOString(),charts:[...charts.values()].sort((a,b)=>a.id.localeCompare(b.id))};
  await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination+".tmp",JSON.stringify(snapshot));
  await rename(destination+".tmp",destination);
  return {snapshot,updated,failures};
}
