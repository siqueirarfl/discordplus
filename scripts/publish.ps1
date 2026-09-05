# Publica o instalador no GitHub Releases e gera o latest.yml para o auto-update.
# Uso: npm run publish   (ou: powershell -ExecutionPolicy Bypass -File scripts\publish.ps1)
# Requer: GitHub CLI (gh) autenticado como siqueirarfl.

$ErrorActionPreference = "Stop"

Write-Host "==> Build (electron-vite)" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build falhou" }

Write-Host "==> Empacotando (electron-builder, sem publish)" -ForegroundColor Cyan
npx electron-builder
if ($LASTEXITCODE -ne 0) { throw "Empacotamento falhou" }

$version = (Get-Content -Raw package.json | ConvertFrom-Json).version
$tag = "v$version"
$exe = "dist\Discord-Plus-Setup-$version.exe"
$blockmap = "$exe.blockmap"

if (-not (Test-Path -LiteralPath $exe)) { throw "Instalador nao encontrado: $exe" }

Write-Host "==> Gerando latest.yml (versao $version)" -ForegroundColor Cyan
$exeAbs = (Resolve-Path -LiteralPath $exe).Path
$bytes = [System.IO.File]::ReadAllBytes($exeAbs)
$sha = [System.Security.Cryptography.SHA512]::Create()
$hashB64 = [Convert]::ToBase64String($sha.ComputeHash($bytes))
$releaseDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$lines = @(
  "version: $version"
  "files:"
  "  - url: Discord-Plus-Setup-$version.exe"
  "    sha512: $hashB64"
  "    size: $($bytes.Length)"
  "path: Discord-Plus-Setup-$version.exe"
  "sha512: $hashB64"
  "releaseDate: '$releaseDate'"
)
$distDir = (Resolve-Path -LiteralPath dist).Path
[System.IO.File]::WriteAllLines("$distDir\latest.yml", $lines)

Write-Host "==> Publicando no GitHub (tag $tag)" -ForegroundColor Cyan
gh release create $tag $exe $blockmap "$distDir\latest.yml" --repo siqueirarfl/discordplus --title "Discord+ $version" --notes "Versao $version"

Write-Host "==> Pronto: https://github.com/siqueirarfl/discordplus/releases/tag/$tag" -ForegroundColor Green
