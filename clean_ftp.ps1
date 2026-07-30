param(
    [string]$FtpHost = "194.36.184.147",
    [string]$FtpUser = "u673071705",
    [string]$FtpPass = 'FahadAshwin25!$',
    [string]$RemoteBase = "/domains/gvice.com/public_html"
)

$creds = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)

function Ftp-List($remotePath) {
    try {
        $req = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remotePath")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $req.Credentials = $creds
        $req.UsePassive = $true
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $items = $reader.ReadToEnd() -split "`n" | Where-Object { $_ -ne "" }
        $reader.Close()
        $resp.Close()
        return $items
    } catch {
        return @()
    }
}

function Ftp-DeleteFile($remotePath) {
    try {
        $req = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remotePath")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
        $req.Credentials = $creds
        $req.UsePassive = $true
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "  Deleted File: $remotePath"
    } catch {
    }
}

function Ftp-RemoveDir($remotePath) {
    try {
        $req = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remotePath")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::RemoveDirectory
        $req.Credentials = $creds
        $req.UsePassive = $true
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "  Deleted Dir: $remotePath"
    } catch {
        Write-Host "  Failed to delete Dir: $remotePath"
    }
}

function Ftp-CleanRecursive($remotePath) {
    Write-Host "Cleaning $remotePath"
    $items = Ftp-List $remotePath
    foreach ($item in $items) {
        $item = $item.Trim()
        if ($item -eq "." -or $item -eq "..") { continue }
        
        $fullPath = "$remotePath/$item"
        # Try to delete as file first
        Ftp-DeleteFile $fullPath
        # If it was a directory, List it and recurse
        $subItems = Ftp-List $fullPath
        if ($subItems.Count -gt 0) {
            Ftp-CleanRecursive $fullPath
        }
        # Try to remove directory
        Ftp-RemoveDir $fullPath
    }
    Ftp-RemoveDir $remotePath
}

$dirsToDelete = @("news", "tenders", "projects", "auction", "article", "seed", "admin", "_next")

foreach ($dir in $dirsToDelete) {
    Ftp-CleanRecursive "$RemoteBase/$dir"
}

Write-Host "Cleanup done!"
