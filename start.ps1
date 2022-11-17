& "$PSScriptRoot\archiveLogs.ps1"
start node --max-old-space-size=6144 $PSScriptRoot\bot_knownBotList_banner.js
start node $PSScriptRoot\bot_orgSync_banner.js
start node $PSScriptRoot\bot_watcher.js