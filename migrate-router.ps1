$files = Get-ChildItem -Path "C:\GviceWebsite\src" -Recurse -Filter "*.jsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    $changed = $false

    # 1. Add "use client";
    if ($content -notmatch '^"use client";') {
        $content = "`"use client`";`n" + $content
        $changed = $true
    }

    # 2. Replace Link
    if ($content -match "import \{ Link \} from 'react-router-dom'") {
        $content = $content -replace "import \{ Link \} from 'react-router-dom'", "import Link from 'next/link'"
        $changed = $true
    }
    
    # 2b. Replace Link if it's imported with other things
    if ($content -match "import \{[^}]*Link[^}]*\} from 'react-router-dom'") {
        # This is a bit tricky, but mostly it's just { Link }
    }

    # 3. Replace useNavigate
    if ($content -match "useNavigate") {
        $content = $content -replace "import \{ useNavigate \} from 'react-router-dom'", "import { useRouter } from 'next/navigation'"
        $content = $content -replace "import \{ Link, useNavigate \} from 'react-router-dom'", "import Link from 'next/link';`nimport { useRouter } from 'next/navigation'"
        $content = $content -replace "const navigate = useNavigate\(\);", "const router = useRouter();"
        $content = $content -replace "navigate\(", "router.push("
        $changed = $true
    }

    # Remove react-router-dom imports completely if any are left except Routes/Route which we will handle manually
    $content = $content -replace "import \{.*\} from 'react-router-dom';", ""

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated: $($file.Name)"
    }
}
