export interface StoreGameProfile {
  id:string;
  name:string;
  market:string;
  capturedAt:string;
  screenshots:string[];
  version:string;
  versionDate:string|null;
  minimumOs:string;
  fileSizeBytes:number|null;
  ageRating:string;
  languages:string[];
  developerUrl:string|null;
  sourceUrl:string;
}
export interface StorefrontCheck {
  state:"available"|"redirected"|"unavailable";
  checkedAt:string;
  sourceUrl:string;
  landedUrl:string|null;
}
export interface StoreDetailsSnapshot {
  version:1;
  capturedAt:string;
  games:Record<string,StoreGameProfile>;
  storefronts:Record<string,StorefrontCheck>;
}
export function classifyStoreDestination(sourceUrl:string,landedUrl:string,ok:boolean):StorefrontCheck["state"]{
  if(!ok)return "unavailable";
  const source=new URL(sourceUrl),landed=new URL(landedUrl);
  const expected=/\/id(\d+)(?:\/|$)/.exec(source.pathname)?.[1];
  const actual=/\/id(\d+)(?:\/|$)/.exec(landed.pathname)?.[1];
  return expected&&actual===expected&&landed.hostname==="apps.apple.com"?"available":"redirected";
}
