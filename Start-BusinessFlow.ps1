$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot 'Backend')
if (-not $env:PGPASSWORD) {
    $password = Read-Host 'PostgreSQL password' -AsSecureString
    $env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $password).Password
}
try {
    node database.js
    if ($LASTEXITCODE -ne 0) { throw 'Database connection failed.' }
    Push-Location (Join-Path $PSScriptRoot 'Frontend')
    try {
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    } finally { Pop-Location }
    Write-Host 'Open http://127.0.0.1:3001 once BusinessFlow says it is ready. Leave this window open.'
    npm.cmd start
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
