import fs from "fs";
const FILES=[ "docs/brandock-spec.md", ...(fs.existsSync("docs/.backups")?fs.readdirSync("docs/.backups").map(f=>`docs/.backups/${f}`):[]) ].filter(p=>fs.existsSync(p));
const RE=[ /\b6[-\s]?Phase\b/gi, /\b44[-\s]?Step(s)?\b/gi, /\bPhase\s*6(\s*of\s*\d+)?\b/gi, /\bStep\s*44(\s*of\s*\d+)?\b/gi, /\bCanonical\s*44[-\s]?Step\s*Plan\b/gi ];
for (const f of FILES){ let s=fs.readFileSync(f,"utf8"); const before=s; for (const rx of RE) s=s.replace(rx,""); s=s.replace(/[ \t]{2,}/g," ").replace(/\n{3,}/g,"\n\n"); if (s!==before){ fs.writeFileSync(f,s,"utf8"); console.log("sanitized:",f);} }
for (const f of FILES){ let s=fs.readFileSync(f,"utf8"); s=s.replace(/^\s*#+\s*$/gm,"").replace(/\n{3,}/g,"\n\n"); fs.writeFileSync(f,s,"utf8"); }
console.log("✅ sanitize-spec: done");
