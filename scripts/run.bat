@echo off
setlocal
cd /d "%~dp0.."

if not exist node_modules (
  echo Dependencias nao instaladas. Rode install.bat primeiro.
  pause
  exit /b 1
)

call npm run dev
