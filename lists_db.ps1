$ErrorActionPreference = 'Stop'
#get web lists
$denylist = [System.Collections.ArrayList]::new()
(Invoke-WebRequest https://raw.githubusercontent.com/LinoYeen/Namelists/main/namelist.txt).content.split("`n") | % { $denylist.Add($_) }
$allowlist = [System.Collections.ArrayList]::new() 
(Invoke-WebRequest https://raw.githubusercontent.com/LinoYeen/Namelists/main/false-positives.txt).content.split("`n") | % { $allowlist.Add($_) }

#db connection
[System.Reflection.Assembly]::LoadWithPartialName("MySql.Data")
[string]$sMySQLUserName = 'yourDBuser'
[string]$sMySQLPW = 'hunter2'
[string]$sMySQLDB = 'your db name'
[string]$sMySQLHost = 'your db ip'
[string]$sConnectionString = "server=" + $sMySQLHost + ";port=3306;uid=" + $sMySQLUserName + ";pwd=" + $sMySQLPW + ";database=" + $sMySQLDB

$con = New-Object MySql.Data.MySqlClient.MySqlConnection
$con.ConnectionString = $sConnectionString

$con = New-Object MySql.Data.MySqlClient.MySqlConnection
$con.ConnectionString = $sConnectionString

foreach ($item in $denylist) {
     
     write-host "checking $item"
     if ($allowlist -contains $item) {
          write-host "denylist contained a allowlisted item $($item)" -foregroundcolor yellow
          continue
     }
          
     try {
          try {
               $con.open()
          }
          catch {
               Write-Warning ("Could not open a connection to Database $sMySQLDB on Host $sMySQLHost. Error: " + $Error[0].ToString())
          }
          $oMYSQLCommand = New-Object MySql.Data.MySqlClient.MySqlCommand
          $oMYSQLCommand.Connection = $con
          #write-host 'INSERT INTO `managed_bans`.`bot_records` (`reporter_name`, `ban_username`, `timestamp`) VALUES (`bravebearbans`,`'+$item+'`,`' +(get-date -format "yyyy-MM-dd") +'`);'
          #$oMYSQLCommand.CommandText = 'INSERT INTO `managed_bans`.`bot_records` (`reporter_name`, `ban_username`, `timestamp`) VALUES (`bravebearbans`,`'+$item+'`,`' +(get-date -format "yyyy-MM-dd") +'`);'
          write-host "insert into ``managed_bans``.``bot_records`` values ('bravebearbans','$item','$(get-date -Format "yyyy-MM-dd")')"
          $oMYSQLCommand.CommandText = "insert into ``managed_bans``.``bot_records`` values ('bravebearbans','$item','$(get-date -Format "yyyy-MM-dd")')"
          #$oMYSQLCommand.Prepare()
          $oMYSQLCommand.ExecuteNonQuery()
     }
     catch {
          write-host "failed inserting $item`n$($Error[0])"
     }
     finally {
          $con.close()
     }


}

