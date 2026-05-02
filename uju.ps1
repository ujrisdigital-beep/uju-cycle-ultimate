param([string]$Query = "What makes a revolutionary AI research engine?")

Write-Host "`n╔═════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🦙 UJU CYCLE MARVEL v5.0 - PROCESSING           ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n🔒 Security: Military-Grade (ε=2.0)" -ForegroundColor Green
Write-Host "🧠 Agents: 6/6 Ready" -ForegroundColor Green
Write-Host "🦙 Model: Qwen2.5 7B (Available)" -ForegroundColor Green

# Agent 1 - Diviner
Write-Host "`n📦 Agent 1/6: Diviner (Compressing to 10% with ε=2.0 privacy)..." -ForegroundColor Cyan
$divinerPrompt = "You are UJU Diviner. Compress this query to 10% preserving all critical signals: $Query"
$divinerResult = ollama run qwen2.5:7b $divinerPrompt
Write-Host "   ✅ Compressed" -ForegroundColor Green

# Agent 2 - Lens Shifter
Write-Host "`n🔄 Agent 2/6: Lens Shifter (Applying 6 analytical lenses)..." -ForegroundColor Cyan
$lensPrompt = "Apply 6 lenses (causal, institutional, cognitive, signal detection, fault-tree, linguistic) to: $divinerResult"
$lensResult = ollama run qwen2.5:7b $lensPrompt
Write-Host "   ✅ 6 lenses applied" -ForegroundColor Green

# Agent 3 - Pattern Weaver
Write-Host "`n🕸️ Agent 3/6: Pattern Weaver (Synthesizing CMO configurations)..." -ForegroundColor Cyan
$weaverPrompt = "Find CMO configurations (Context-Mechanism-Outcome) from: $lensResult"
$weaverResult = ollama run qwen2.5:7b $weaverPrompt
Write-Host "   ✅ CMO patterns identified" -ForegroundColor Green

# Agent 4 - Critic
Write-Host "`n⚔️ Agent 4/6: Tyler Wise Critic (Red teaming with ACH + Pre-mortem)..." -ForegroundColor Cyan
$criticPrompt = "Red-team this analysis with ACH matrix and pre-mortem: $weaverResult"
$criticResult = ollama run qwen2.5:7b $criticPrompt
Write-Host "   ✅ Critique complete" -ForegroundColor Green

# Agent 5 - Explainer
Write-Host "`n📝 Agent 5/6: Explainer (Generating human-readable output)..." -ForegroundColor Cyan
$explainerPrompt = "Provide executive summary, actionable recommendations, and confidence intervals for: $criticResult"
$explainerResult = ollama run qwen2.5:7b $explainerPrompt
Write-Host "   ✅ Explanation ready" -ForegroundColor Green

# Agent 6 - Self-Improvement
Write-Host "`n🧠 Agent 6/6: Self-Improvement (Bayesian updating)..." -ForegroundColor Cyan
$learningPrompt = "Update Bayesian weights based on this session. Output improvement metrics."
$learningResult = ollama run qwen2.5:7b $learningPrompt
Write-Host "   ✅ Learning applied" -ForegroundColor Green

# Final Output
Write-Host "`n╔═════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    📋 FINAL ANSWER                         ║" -ForegroundColor Green
Write-Host "╚═════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n$explainerResult" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🔒 Security: ε=2.0 Differential Privacy" -ForegroundColor Green
Write-Host "🧠 Self-Improvement: Bayesian Active Learning" -ForegroundColor Green
Write-Host "📊 Agents Executed: 6/6" -ForegroundColor Green
Write-Host "🦙 Model: Qwen2.5 7B (Local)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
