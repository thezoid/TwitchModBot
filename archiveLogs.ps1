Write-Host "Archiving logs from $PSScriptRoot\logs to $PSScriptRoot\archive\$(Get-Date -format "yyyyMMMdd").zip"
Compress-Archive -CompressionLevel Fastest -Path "$PSScriptRoot\logs\*" -DestinationPath "$PSScriptRoot\archive\$(Get-Date -format "yyyyMMMdd").zip"
Get-ChildItem "$PSScriptRoot\logs\*" -File | % { remove-item $_.FullName}