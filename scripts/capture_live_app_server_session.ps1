$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$outputPath = Join-Path $repoRoot 'release-evidence\live-app-server-session.jsonl'
$summaryPath = Join-Path $repoRoot 'release-evidence\live-app-server-session-summary.json'
$tempRequestPath = Join-Path $repoRoot 'release-evidence\live-app-server-request.tmp.json'
$tempResponsePath = Join-Path $repoRoot 'release-evidence\live-app-server-response.tmp.json'

$transcript = New-Object System.Collections.Generic.List[object]
$approvalHandled = $false
$commandDecision = $null
$finished = $false
$commandExecRequestId = 'command-exec-1'
$configReadRequestId = 'config-read-1'

function Add-TranscriptEntry {
  param(
    [string]$Direction,
    $Message
  )

  $transcript.Add([pscustomobject]@{
    timestampUtc = [DateTime]::UtcNow.ToString('o')
    direction = $Direction
    message = $Message
  })
}

function Send-JsonLine {
  param(
    [System.IO.StreamWriter]$Writer,
    $Payload
  )

  if ($null -eq $Payload.jsonrpc) {
    $Payload | Add-Member -NotePropertyName jsonrpc -NotePropertyValue '2.0'
  }

  Add-TranscriptEntry -Direction 'client->server' -Message $Payload
  $Writer.WriteLine(($Payload | ConvertTo-Json -Compress -Depth 20))
  $Writer.Flush()
}

function Complete-Session {
  param(
    [string]$Status,
    [hashtable]$Extra = @{}
  )

  if ($finished) { return }
  $script:finished = $true

  $transcript | ForEach-Object {
    $_ | ConvertTo-Json -Compress -Depth 30
  } | Set-Content $outputPath

  $summary = [ordered]@{
    capturedAtUtc = [DateTime]::UtcNow.ToString('o')
    status = $Status
    approvalHandled = $script:approvalHandled
    commandDecision = $script:commandDecision
    transcriptPath = 'release-evidence/live-app-server-session.jsonl'
  }

  foreach ($key in $Extra.Keys) {
    $summary[$key] = $Extra[$key]
  }

  $summary | ConvertTo-Json -Depth 20 | Set-Content $summaryPath
  Get-Content $summaryPath
}

$codexCommand = Get-Command codex -ErrorAction Stop
$pwshCommand = Get-Command pwsh -ErrorAction Stop

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $pwshCommand.Source
$psi.Arguments = "-File `"$($codexCommand.Source)`" app-server --listen stdio://"
$psi.WorkingDirectory = $repoRoot
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi
$started = $process.Start()
if (-not $started) {
  throw 'Failed to start codex app-server process.'
}

$stdout = $process.StandardOutput
$stdin = $process.StandardInput
$stderr = $process.StandardError

$initRequest = @{
  id = 'init-1'
  method = 'initialize'
  params = @{
    clientInfo = @{
      name = 'codex-trusted-mode-harness'
      version = '0.1.0'
    }
    capabilities = @{
      experimentalApi = $true
    }
  }
}

Send-JsonLine -Writer $stdin -Payload $initRequest

$deadline = (Get-Date).AddSeconds(45)

while ((Get-Date) -lt $deadline -and -not $finished -and -not $process.HasExited) {
  while ($stderr.Peek() -ge 0) {
    $stderrLine = $stderr.ReadLine()
    if (-not [string]::IsNullOrWhiteSpace($stderrLine)) {
      Add-TranscriptEntry -Direction 'server-stderr' -Message $stderrLine
    }
  }

  if ($stdout.Peek() -ge 0) {
    $line = $stdout.ReadLine()
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    try {
      $message = $line | ConvertFrom-Json
      Add-TranscriptEntry -Direction 'server->client' -Message $message
    } catch {
      Add-TranscriptEntry -Direction 'server->client:raw' -Message $line
      continue
    }

    if ($message.id -and $message.result.userAgent) {
      $initialized = @{
        method = 'initialized'
      }
      Send-JsonLine -Writer $stdin -Payload $initialized

      $configRead = @{
        id = $configReadRequestId
        method = 'config/read'
        params = @{
          cwd = $repoRoot
          includeLayers = $true
        }
      }
      Send-JsonLine -Writer $stdin -Payload $configRead
      continue
    }

    if ($message.id -eq $configReadRequestId -and $null -ne $message.result) {
      $commandExec = @{
        id = $commandExecRequestId
        method = 'command/exec'
        params = @{
          cwd = $repoRoot
          command = @('pwsh', '-Command', 'Get-Content README.md')
          sandboxPolicy = @{
            type = 'readOnly'
            networkAccess = $false
          }
          timeoutMs = 10000
        }
      }
      Send-JsonLine -Writer $stdin -Payload $commandExec
      continue
    }

    if (
      $message.method -eq 'item/commandExecution/requestApproval' -or
      $message.method -eq 'item/fileChange/requestApproval' -or
      $message.method -eq 'execCommandApproval' -or
      $message.method -eq 'applyPatchApproval'
    ) {
      $script:approvalHandled = $true
      $message | ConvertTo-Json -Depth 50 | Set-Content $tempRequestPath
      $evaluationJson = node scripts/evaluate_app_server_request.js --input $tempRequestPath
      $evaluation = $evaluationJson | ConvertFrom-Json
      $script:commandDecision = $evaluation.response.decision
      $response = @{
        id = $message.id
        result = $evaluation.response
      }
      $response | ConvertTo-Json -Depth 20 | Set-Content $tempResponsePath
      Send-JsonLine -Writer $stdin -Payload $response
      continue
    }

    if ($message.id -eq $commandExecRequestId -and $null -ne $message.result) {
      Complete-Session -Status ($(if ($approvalHandled) { 'captured' } else { 'completed_without_approval' })) -Extra @{
        commandExecResult = $message.result
      }
      break
    }

    if ($message.method -eq 'turn/completed') {
      Complete-Session -Status ($(if ($approvalHandled) { 'captured' } else { 'completed_without_approval' })) -Extra @{
        finalNotification = 'turn/completed'
      }
      break
    }
  } else {
    Start-Sleep -Milliseconds 100
  }
}

if (-not $finished) {
  if ($process.HasExited) {
    Complete-Session -Status 'process_exit' -Extra @{
      exitCode = $process.ExitCode
    }
  } else {
    Complete-Session -Status 'timeout' -Extra @{
      reason = 'No live approval callback captured before timeout.'
    }
  }
}

try {
  if (-not $process.HasExited) {
    $process.Kill()
  }
} catch {}
