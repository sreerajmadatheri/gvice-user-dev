param(
    [string]$LocalDir = "C:\GviceWebsite\dist",
    [string]$FtpHost = "194.36.184.147",
    [string]$FtpUser = "u673071705",
    [string]$FtpPass = 'FahadAshwin25!$',
    [string]$RemoteBase = "/domains/gvice.com/public_html"
)

$creds = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)

function Ftp-CreateDir($remotePath) {
    try {
        $req = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remotePath")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.Credentials = $creds
        $req.UsePassive = $true
        $req.UseBinary = $true
        $resp = $req.GetResponse()
        $resp.Close()
    } catch {}
}

function Ftp-UploadFile($localFile, $remotePath) {
    try {
        $req = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remotePath")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $req.Credentials = $creds
        $req.UsePassive = $true
        $req.UseBinary = $true
        $req.ContentLength = (Get-Item $localFile).Length

        $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
        $stream = $req.GetRequestStream()
        $stream.Write($fileBytes, 0, $fileBytes.Length)
        $stream.Close()

        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "  Uploaded: $remotePath"
    } catch {
        Write-Host "  FAILED: $remotePath - $_"
    }
}

function Upload-Directory($localPath, $remotePath) {
    Ftp-CreateDir $remotePath

    # Upload files
    Get-ChildItem $localPath -File | ForEach-Object {
        $remoteFile = "$remotePath/$($_.Name)"
        Ftp-UploadFile $_.FullName $remoteFile
    }

    # Recurse into subdirectories
    Get-ChildItem $localPath -Directory | ForEach-Object {
        $subRemote = "$remotePath/$($_.Name)"
        Upload-Directory $_.FullName $subRemote
    }
}

Write-Host "Starting upload to Hostinger..."
Write-Host "Local:  $LocalDir"
Write-Host "Remote: ftp://$FtpHost$RemoteBase"
Write-Host ""

Upload-Directory $LocalDir $RemoteBase

Write-Host ""
Write-Host "Upload complete! Visit https://gvice.com to see your site."
