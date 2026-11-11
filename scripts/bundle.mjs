// Optional development command. CI uses the committed self-contained collector.
import {build} from 'esbuild';
await build({entryPoints:['collector-src/deploy/static/build.ts'],outfile:'scripts/collector.mjs',bundle:true,platform:'node',format:'esm',target:'node24',
 alias:{'@aihot/backend/config':'./collector-src/deploy/static/config.ts','@aihot/contracts':'./collector-src/packages/contracts/src','@aihot/industry':'./collector-src/industry','@aihot/site':'./collector-src/site/site.ts'},
 banner:{js:'import { createRequire } from "node:module"; const require=createRequire(import.meta.url);'}});
