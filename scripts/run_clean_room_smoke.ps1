param(
  [string]$EnvironmentLabel = "local-clean-room",
  [string]$CodexRuntime = "unknown",
  [switch]$SkipNodeTest
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runId = "$EnvironmentLabel-$timestamp"
$tempRoot = Join-Path $repoRoot ".clean-room\$runId"
$evidenceRoot = Join-Path $repoRoot "release-evidence\matrix"
$runsRoot = Join-Path $evidenceRoot "runs"
$summaryPath = Join-Path $runsRoot "$runId.json"

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Force -Path $runsRoot | Out-Null

$env:NPM_CONFIG_CACHE = Join-Path $tempRoot "npm-cache"

$steps = New-Object System.Collections.Generic.List[object]

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action,
    [switch]$Optional
  )

  $startedAt = [DateTime]::UtcNow.ToString("o")
  try {
    & $Action
    $steps.Add([pscustomobject]@{
      name = $Name
      status = "passed"
      optional = [bool]$Optional
      startedAtUtc = $startedAt
      completedAtUtc = [DateTime]::UtcNow.ToString("o")
    })
  } catch {
    $status = if ($Optional) { "warning" } else { "failed" }
    $steps.Add([pscustomobject]@{
      name = $Name
      status = $status
      optional = [bool]$Optional
      startedAtUtc = $startedAt
      completedAtUtc = [DateTime]::UtcNow.ToString("o")
      detail = $_.Exception.Message
    })
    if (-not $Optional) {
      throw
    }
  }
}

Push-Location $repoRoot
try {
  if (-not $SkipNodeTest) {
    Invoke-Step "node_test" { node --test | Out-Host } -Optional
  }
  Invoke-Step "verify_config_contract" { node scripts/verify_config_contract.js | Out-Host }
  Invoke-Step "verify_local_hardening" { node scripts/verify_local_hardening.js | Out-Host }
  Invoke-Step "verify_pdp_request_shape" { node scripts/verify_pdp_request_shape.js | Out-Host }
  Invoke-Step "verify_certification_gate" { node scripts/verify_certification_gate.js | Out-Host }
  Invoke-Step "package_dry_run" { npm pack --dry-run --cache .npm-cache | Out-Host }
  Invoke-Step "free_demo" { node scripts/run_free_demo.js | Out-Host }
} finally {
  Pop-Location
}

$summary = [ordered]@{
  capturedAtUtc = [DateTime]::UtcNow.ToString("o")
  runId = $runId
  environmentLabel = $EnvironmentLabel
  codexRuntime = $CodexRuntime
  repoRoot = $repoRoot
  isolatedTempRoot = $tempRoot
  overallStatus = if ($steps.status -contains "failed") { "failed" } else { "passed" }
  steps = $steps
}

$summary | ConvertTo-Json -Depth 20 | Set-Content $summaryPath
Get-Content $summaryPath
