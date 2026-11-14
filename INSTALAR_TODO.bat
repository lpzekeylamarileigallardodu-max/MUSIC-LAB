@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Academia Jaime Gallardo - Instalacion
cd /d "%~dp0"
set "LOG=%~dp0instalar.log"
echo ==== Instalacion %date% %time% ==== > "%LOG%"

rem ---------- 1) Programas: Java, Node y Docker ----------
call :paso "Java"   "java -version"    "Microsoft.OpenJDK.21"
call :paso "Node"   "node -v"          "OpenJS.NodeJS.LTS"
call :paso "Docker" "docker --version" "Docker.DockerDesktop"

rem ---------- 2) Docker Desktop encendido ----------
docker info >nul 2>&1
if errorlevel 1 (
  echo Abriendo Docker Desktop...
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
)
set /a N=0
:esperaDocker
docker info >nul 2>&1
if not errorlevel 1 goto dockerListo
set /a N+=1
if !N! GEQ 60 ( echo [X] Docker no arranco en 5 minutos>>"%LOG%" & goto fin )
timeout /t 5 /nobreak >nul
goto esperaDocker
:dockerListo
for /f "delims=" %%v in ('docker --version') do echo [OK] %%v>>"%LOG%"

rem ---------- 3) Base de datos en Docker (solo la base) ----------
echo Levantando la base de datos en Docker...
echo ---- docker compose up ---->>"%LOG%"
docker compose up -d --remove-orphans >>"%LOG%" 2>&1
if errorlevel 1 ( echo [X] Fallo docker compose>>"%LOG%" & goto fin )
docker compose ps >>"%LOG%" 2>&1

rem ---------- 4) Dependencias: backend (Apache POI) y frontend ----------
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8080 .*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo Compilando backend (descarga Apache POI)...
echo ---- gradle bootJar ---->>"%LOG%"
pushd backend
call gradlew.bat --no-daemon bootJar -x test >>"%LOG%" 2>&1
if errorlevel 1 (echo [X] Fallo la compilacion del backend>>"%LOG%") else (echo [OK] Backend compilado con Apache POI>>"%LOG%")
popd
pushd frontend
if not exist node_modules call npm install --no-audit --no-fund >>"%LOG%" 2>&1
popd
echo [OK] Frontend listo>>"%LOG%"

rem ---------- 5) Arrancar la app y probarla ----------
start "Academia - Arranque" "%~dp0INICIAR.bat"
set /a N=0
:esperaApp
timeout /t 5 /nobreak >nul
set /a N+=1
curl.exe -s -o NUL http://localhost:8080/api/health
if errorlevel 1 if !N! LSS 60 goto esperaApp
call "%~dp0PROBAR.bat"
echo [OK] Prueba guardada en pruebas\probar.log>>"%LOG%"

:fin
echo ==== FIN %time% ====>>"%LOG%"
echo Terminado. Revisa instalar.log y pruebas\probar.log
timeout /t 10 >nul
exit /b

:paso
%~2 >nul 2>&1
if errorlevel 1 (
  echo Instalando %~1...
  winget install -e --id %~3 --accept-package-agreements --accept-source-agreements >>"%LOG%" 2>&1
  if errorlevel 1 (echo [X] %~1 no se pudo instalar>>"%LOG%") else (echo [OK] %~1 instalado>>"%LOG%")
) else (
  echo [OK] %~1 ya estaba instalado>>"%LOG%"
)
exit /b
