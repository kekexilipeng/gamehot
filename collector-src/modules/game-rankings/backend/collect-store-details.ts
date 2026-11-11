import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { config } from "@aihot/backend/config";
import type { MobileSnapshot } from "../mobile-contracts.ts";
import { classifyStoreDestination, type StoreDetailsSnapshot, type StoreGameProfile } from "../store-details.ts";

function webUrl(value:unknown):string|null {
  if(typeof value!=="string")return null;
  try{const u=new URL(value);return ["https:","http:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function parseStoreProfile(row:any,market:string):StoreGameProfile {
  const id=String(row.trackId??"");
  if(!/^\d+$/.test(id)||row.wrapperType!=="software"||typeof row.trackName!=="string")throw new Error("Apple 游戏资料无效");
  const sourceUrl=webUrl(row.trackViewUrl);
  if(!sourceUrl||new URL(sourceUrl).hostname!=="apps.apple.com"||/\/id(\d+)(?:\/|$)/.exec(new URL(sourceUrl).pathname)?.[1]!==id)throw new Error("Apple 游戏资料链接无效");
  const pictures=Array.isArray(row.screenshotUrls)&&row.screenshotUrls.length?row.screenshotUrls:row.ipadScreenshotUrls;
  const screenshots=(Array.isArray(pictures)?pictures:[]).filter((s:unknown)=>{const u=webUrl(s);return u&&new URL(u).protocol==="https:"&&new URL(u).hostname.endsWith(".mzstatic.com");}).slice(0,6);
  const size=Number(row.fileSizeBytes);
  return {id,name:row.trackName,market,capturedAt:new Date().toISOString(),screenshots,
    version:typeof row.version==="string"?row.version:"",versionDate:Number.isFinite(Date.parse(row.currentVersionReleaseDate))?row.currentVersionReleaseDate:null,
    minimumOs:typeof row.minimumOsVersion==="string"?row.minimumOsVersion:"",fileSizeBytes:Number.isFinite(size)&&size>0?size:null,
    ageRating:row.contentAdvisoryRating??"",languages:Array.isArray(row.languageCodesISO2A)?row.languageCodesISO2A.filter((v:unknown)=>typeof v==="string"):[],
    developerUrl:webUrl(row.sellerUrl),sourceUrl};
}
async function readInput():Promise<MobileSnapshot>{
  try{return JSON.parse(await readFile(path.join(config.dataDir,"mobile-rankings.json"),"utf8"));}
  catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;return JSON.parse(await readFile(new URL("../data/mobile-initial.json",import.meta.url),"utf8"));}
}
/** Explicit/background enrichment only. ID lookup avoids name collisions between games. */
export async function collectStoreDetails(destination=path.join(config.dataDir,"game-store-details.json"),input?:MobileSnapshot){
  const rankings=input??await readInput();
  let prior:StoreDetailsSnapshot|undefined;
  try{prior=JSON.parse(await readFile(destination,"utf8"));}catch(e){
    if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
    if(path.resolve(destination)===path.resolve(config.dataDir,"game-store-details.json")){
      try{prior=JSON.parse(await readFile(new URL("../data/store-details-initial.json",import.meta.url),"utf8"));}
      catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
    }
  }
  const snapshot:StoreDetailsSnapshot={version:1,capturedAt:new Date().toISOString(),games:{...prior?.games},storefronts:{...prior?.storefronts}};
  const seen=new Set<string>(),failures:Array<{market:string;ids:string[];error:string}>=[];
  let updated=0;
  for(const market of ["us","cn","jp","kr","tw","de"]){
    const charts=rankings.charts.filter(c=>c.source==="App Store"&&c.market===market);
    const allGames=charts.flatMap(c=>c.games);
    const example=charts.find(c=>c.category==="slg"&&c.metric==="grossing")?.games[0]??allGames[0];
    if(example){
      try{
        const r=await fetch(example.url,{signal:AbortSignal.timeout(20000)});
        snapshot.storefronts[market]={state:classifyStoreDestination(example.url,r.url,r.ok),checkedAt:new Date().toISOString(),sourceUrl:example.url,landedUrl:r.url};
        await r.body?.cancel();
      }catch{snapshot.storefronts[market]={state:"unavailable",checkedAt:new Date().toISOString(),sourceUrl:example.url,landedUrl:null};}
    }
    const ids=[...new Set(allGames.map(g=>g.id))].filter(id=>!seen.has(id));
    for(let i=0;i<ids.length;i+=200){
      const batch=ids.slice(i,i+200);
      try{
        const url=`https://itunes.apple.com/lookup?country=${market}&id=${batch.join(",")}`;
        const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
        if(!response.ok)throw new Error(`Apple Lookup HTTP ${response.status}`);
        const body:any=await response.json();
        if(!Array.isArray(body.results))throw new Error("Apple Lookup 结构无效");
        for(const row of body.results){if(!batch.includes(String(row.trackId)))continue;const profile=parseStoreProfile(row,market);snapshot.games[profile.id]=profile;seen.add(profile.id);updated++;}
      }catch(e){failures.push({market,ids:batch,error:e instanceof Error?e.message:String(e)});}
      // Apple's published limit is approximately 20 calls/minute. Do not parallelize lookup batches.
      await delay(3100);
    }
  }
  if(!updated)throw new Error("游戏资料未取得新内容，保留原快照");
  await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination+".tmp",JSON.stringify(snapshot));await rename(destination+".tmp",destination);
  return {snapshot,updated,failures};
}
