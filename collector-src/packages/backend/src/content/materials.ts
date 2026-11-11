import {identityKeyForUrl} from "../lib/url.ts";
import {sha256} from "../lib/ids.ts";
export function identityKeyFor(m:any):string {if(m.identityKey)return m.identityKey;if(m.xPost?.tweetId)return `x:${m.xPost.tweetId}`;return identityKeyForUrl(m.url)||`src:${m.sourceId}:${sha256(m.url+"\u0001"+m.title).slice(0,32)}`;}
