$ErrorActionPreference = 'Stop'

param(
  [string]$Prompt = "List the files in the current directory and then stop.",
  [string]$WorkingDirectory = "C:\dev\codex-trusted-mode",
  [string]$OutputPath = "C:\dev\codex-trusted-mode\release-evidence\codex-exec-capture.jsonl"
)

codex exec --json --skip-git-repo-check --sandbox read-only --cd $WorkingDirectory $Prompt | Set-Content -Path $OutputPath -Encoding utf8
Write-Output "Codex JSONL capture written to $OutputPath"
