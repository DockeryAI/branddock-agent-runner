import fs from "fs";

const STATE_PATHS = [".runner/state.json", "state/.runner/state.json"];
const SPEC_PATH = "docs/brandock-spec.md";

function readJSON(p){ try { return JSON.parse(fs.readFileSync(p,"utf8")); } catch { return null; } }
function findStatePath(){ for (const p of STATE_PATHS) if (fs.existsSync(p)) return p; return null; }

function replaceBlock(src, marker, content){
  const start = `<!-- ${marker} -->`;
  const end   = `<!-- /${marker} -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`, "m");
  const block = `${start}\n${content}\n${end}`;
  return re.test(src) ? src.replace(re, block) : `${block}\n\n${src}`;
}

function computeExecution(state){
  const phase = Number(state?.phase);
  const step  = Number(state?.step);
  const tp    = Number(state?.total_phases);
  const ts    = Number(state?.total_steps_in_current_phase);

  const havePhase = Number.isFinite(phase);
  const haveTP    = Number.isFinite(tp);
  const haveStep  = Number.isFinite(step);
  const haveTS    = Number.isFinite(ts) && ts > 0;

  const phaseLabel = havePhase && haveTP ? `${phase} of ${tp}` : havePhase ? String(phase) : "n/a";
  const stepLabel  = haveStep && haveTS ? `${step} of ${ts}`  : haveStep  ? String(step)  : "n/a";
  const pct = haveStep && haveTS ? Math.round((step/ts)*100) : null;

  return { phaseLabel, stepLabel, pct };
}

function computeV1FromSpec(spec){
  // Dash at end to avoid char-class ranges; Node 20/24 safe.
  const tokens = spec.split(/[\\s|:,\\/(){}[\\]`-]+/g);
  const W = { "✅":1.0, "🟡":0.5, "🧩":0.5, "⏳":0.25, "❌":0.0 };
  let total = 0, score = 0;
  for (const t of tokens) if (W[t] != null) { total++; score += W[t]; }
  const pct = total > 0 ? Math.round((score/total)*100) : null;
  return { total, score, pct };
}

const sp = findStatePath();
if (!sp) {
  console.error("No state file found (.runner/state.json or state/.runner/state.json)");
  process.exit(1);
}

const state = readJSON(sp) || {};
fs.mkdirSync("docs", { recursive: true });
if (!fs.existsSync(SPEC_PATH)) fs.writeFileSync(SPEC_PATH, "# Project Spec\n\n", "utf8");

let spec = fs.readFileSync(SPEC_PATH, "utf8");
const exec = computeExecution(state);
const v1   = computeV1FromSpec(spec);
const ts   = new Date().toISOString();

const execBlock = [
  "### ⚙️ Execution Status (auto)",
  `**Phase:** ${exec.phaseLabel} — **Step:** ${exec.stepLabel}` + (exec.pct != null ? ` — **Derived Completion:** ~${exec.pct}%` : ""),
  `**Synced:** ${ts}`,
  `_Source: ${sp}_`
].join("\n");

const v1Block = [
  "### 📘 V1 Spec Baseline (auto)",
  `**Derived Completion (from spec status tokens):** ${v1.pct != null ? `~${v1.pct}%` : "n/a"}`,
  `**Synced:** ${ts}`,
  `_Method: weighted parse of ✅(1.0), 🧩/🟡(0.5), ⏳(0.25), ❌(0.0) across spec tables/lists._`
].join("\n");

spec = replaceBlock(spec, "SYNC:EXECUTION", execBlock);
spec = replaceBlock(spec, "SYNC:V1_BASELINE", v1Block);
fs.writeFileSync(SPEC_PATH, spec, "utf8");

const status = {
  synced_at: ts,
  execution: {
    phase_label: exec.phaseLabel,
    step_label:  exec.stepLabel,
    derived_completion_percent: exec.pct
  },
  v1_baseline: {
    derived_completion_percent: v1.pct,
    tokens_total: v1.total,
    weighted_score: v1.score
  },
  sources: { state: sp, spec: SPEC_PATH }
};
fs.writeFileSync(".runner/status.json", JSON.stringify(status, null, 2), "utf8");
console.log("✅ Spec + status synced (autocalc)");
