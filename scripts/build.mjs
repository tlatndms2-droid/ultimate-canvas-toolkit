import {build} from 'esbuild';
import fs from 'node:fs/promises';
await build({entryPoints:['src/main.ts'],bundle:true,platform:'node',format:'cjs',target:'es2022',external:['obsidian','electron','@electron/remote','@codemirror/state','@codemirror/view','@lezer/common','@lezer/highlight','@lezer/lr'],outfile:'main.js',logLevel:'info'});
const modules=['mindmap','outliner','portal','pdf','palette','visibility'];
const styles=[];
for(const name of modules){try{styles.push(`/* UCT source module: ${name} */\n`+await fs.readFile(`vendor/${name}/styles.css`,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}
styles.push(await fs.readFile('src/styles.css','utf8'));
await fs.writeFile('styles.css',styles.join('\n'));
