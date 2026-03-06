$lines = @(
  ((Get-Content "$PSScriptRoot\..\examples\app-server-initialize-request.json" -Raw | ConvertFrom-Json) | ConvertTo-Json -Compress),
  ((Get-Content "$PSScriptRoot\..\examples\native-command-approval-request.json" -Raw | ConvertFrom-Json) | ConvertTo-Json -Compress),
  ((Get-Content "$PSScriptRoot\..\examples\native-file-change-approval-request.json" -Raw | ConvertFrom-Json) | ConvertTo-Json -Compress)
)

$payload = ($lines -join "`n") + "`n"
$payload | node "$PSScriptRoot\app_server_bridge_stdio.js"
