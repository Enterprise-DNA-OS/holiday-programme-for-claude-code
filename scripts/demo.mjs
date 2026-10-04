import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { REPO_ROOT } from './lib/db.mjs';
const env={...process.env,DATABASE_URL:'',DATA_DIR:path.join(REPO_ROOT,'.data/demo')};
for(const args of [['migrate.mjs'],['seed.mjs'],['holiday.mjs','session-plan'],['holiday.mjs','pickup-check'],['holiday.mjs','compliance']]){const p=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',args[0]),...args.slice(1)],{cwd:REPO_ROOT,env,stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);}
console.log('Fictional data only: .data/demo');
