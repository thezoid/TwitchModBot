get-childitem "$PSScriptRoot/data" -file | % { remove-item $_.fullname -force }

$denylist = [System.Collections.ArrayList]::new()
(Invoke-WebRequest https://raw.githubusercontent.com/LinoYeen/Namelists/main/namelist.txt).content.split("`n") | % { $denylist.Add($_) }
$allowlist = [System.Collections.ArrayList]::new() 
(Invoke-WebRequest https://raw.githubusercontent.com/LinoYeen/Namelists/main/false-positives.txt).content.split("`n") | % { $allowlist.Add($_) }
$rootPath = "$PSScriptRoot/data/part"
$pageSize = 10000
$loop = 1
$count = 0

foreach ($item in $denylist) {
     $count += 1
     Write-Host "`nloop: $loop`t count: $(($loop*$pageSize)+$count)"
     write-host "[$count] checking $item"
     if ($allowlist -contains $item) {
          write-host "denylist contained a allowlisted item $($item)" -foregroundcolor yellow
          #$denylist.Remove($item)
          continue
     }
     "$item" | out-file "$($rootPath)$($loop).txt" -Append
     if ($count -ge $pageSize) {
          $count = 0
          $loop += 1
          write-host "new page: $($rootPath)$($loop).txt"
     }
}
