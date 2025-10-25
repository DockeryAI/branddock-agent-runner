import fs from "fs";
const STATE_PATHS=[".runner/state.json","state/.runner/state.json"];
const SPEC_PATH="docs/brandock-spec.md";
function readJSON(p){try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return null}}
function findStatePath(){for(const p of STATE_PATHS)if(fs.existsSync(p))return p;return null}
function replaceBlock(src,m,c){const s=`<!-- ${m} -->`,e=`<!-- /${m} -->`,re=new RegExp(`${s}[\\s\\S]*?${e}`,"m"),blk=`${s}\n${c}\n${e}`;return re.test(src)?src.replace(re,blk):`${blk}\n\n${src}`}
function exec(st){const P=+st?.phase,S=+st?.step,TP=+st?.total_phases,TS=+st?.total_steps_in_current_phase;const phaseLbl=(Number.isFinite(P)&&Number.isFinite(TP))?`${P} of ${TP}`:Number.isFinite(P)?String(P):"n/a";const stepLbl=(Number.isFinite(S)&&Number.isFinite(TS)&&TS>0)?`${S} of ${TS}`:Number.isFinite(S)?String(S):"n/a";const pct=(Number.isFinite(S)&&Number.isFinite(TS)&&TS>0)?Math.round(S/TS*100):null;return {phaseLbl:phaseLbl,stepLbl:stepLbl,pct:pct}}
function v1(spec){const W={"✅":1,"🟡":.5,"🧩":.5,"⏳":.25,"❌":0};const tokens=spec.split(/[\\s|:,\\/(){}[\\]`-]+/g);let tot=0,sc=0;for(const t of tokens){if(W[t]!=null){tot++;sc+=W[t]}}const pct=tot>0?Math.round(sc/tot*100):null;return {tot:tot,sc:sc,pct:pct}}
const sp=findStatePath();if(!sp){console.error("No state file found");process.exit(0)}
const st=readJSON(sp)||{},ts=new Date().toISOString();
fs.mkdirSync("docs",{recursive:true});if(!fs.existsSync(SPEC_PATH))fs.writeFileSync(SPEC_PATH,"# Project Spec\n\n","utf8");
let spec=fs.readFileSync(SPEC_PATH,"utf8");
const E=exec(st),V=v1(spec);
const execBlock=`### ⚙️ Execution Status (auto)
**Phase:** ${E.phaseLbl} — **Step:** ${E.stepLbl}${E.pct!=null?` — **Derived Completion:** ~${E.pct}%`:""}
**Synced:** ${ts}
_Source: ${sp}_`;
const v1Block=`### 📘 V1 Spec Baseline (auto)
**Derived Completion (from spec status tokens):** ${V.pct!=null?`~${V.pct}%`:"n/a"}
**Synced:** ${ts}
_Method: weighted parse of ✅(1.0), 🧩/🟡(0.5), ⏳(0.25), ❌(0.0) across spec tables/lists._`;
spec=replaceBlock(spec,"SYNC:EXECUTION",execBlock);
spec=replaceBlock(spec,"SYNC:V1_BASELINE",v1Block);
fs.writeFileSync(SPEC_PATH,spec,"utf8");
fs.writeFileSync(".runner/status.json",JSON.stringify({synced_at:ts,execution:{phase_label:E.phaseLbl,step_label:E.stepLbl,derived_completion_percent:E.pct},v1_baseline:{derived_completion_percent:V.pct,tokens_total:V.tot,weighted_score:V.sc},sources:{state:sp,spec:SPEC_PATH}},null,2),"utf8");
console.log("✅ Spec + status synced (autocalc)");
