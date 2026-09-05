@echo off
setlocal
echo ============================================
echo  Discord+ - instalando dependencias
echo ============================================
cd /d "%~dp0.."

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

call npm install
if errorlevel 1 (
  echo [ERRO] Falha ao instalar dependencias.
  pause
  exit /b 1
)

echo.
echo Instalacao concluida! Use run.bat para abrir o app.
pause
