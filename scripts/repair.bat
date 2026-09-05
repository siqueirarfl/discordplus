@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo  Discord+ - reparando instalacao
echo ============================================

echo [1/3] Reinstalando dependencias...
call npm install
if errorlevel 1 goto erro

echo [2/3] Reconstruindo modulo nativo (better-sqlite3)...
call npx electron-builder install-app-deps
if errorlevel 1 goto erro

echo [3/3] Limpando build antigo...
if exist out rmdir /s /q out
if exist dist rmdir /s /q dist

echo.
echo Reparo concluido! Use run.bat para testar.
pause
exit /b 0

:erro
echo [ERRO] O reparo falhou. Tente rodar como administrador.
pause
exit /b 1
