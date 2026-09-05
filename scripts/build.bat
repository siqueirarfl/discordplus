@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo  Discord+ - gerando instalador (build)
echo ============================================

call npm run dist
if errorlevel 1 (
  echo [ERRO] Falha ao gerar o instalador.
  pause
  exit /b 1
)

echo.
echo Instalador gerado em dist\Discord-Plus-Setup-1.0.0.exe
pause
