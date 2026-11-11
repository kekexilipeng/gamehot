import path from "node:path";
export const config={dataDir:path.resolve(process.env.GAMEHOT_DATA_DIR||"data"),siteUrl:process.env.GAMEHOT_PREVIOUS_URL||"https://github.com/",allowPrivateNetworkFetch:false,privateFeedHosts:[],egressProxyUrl:null};
export const isProduction=false;
