@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Academia Jaime Gallardo - Arranque
cd /d "%~dp0"
if not "%~1"=="_log" (
  set "LOG=%~dp0iniciar.log"
  rem Si el log esta bloqueado por otro proceso, usa uno nuevo
  ( >>"%~dp0iniciar.log" echo. ) 2>nul || set "LOG=%~dp0iniciar_%RANDOM%.log"
  "%ComSpec%" /c ""%~f0" _log" > "!LOG!" 2>&1
  type "!LOG!"
  pause
  exit /b
)

rem ==== Config: la clave sale de backend\src\main\resources\application.yaml ====
set "DB_NAME=academia_jaime_gallardo"
set "DB_USER=postgres"
set "DB_PASS="
rem La clave se lee del application.yaml (la primera linea "password:" es la de la base)
for /f "tokens=1,* delims=:" %%a in ('findstr /r /c:"^ *password:" "backend\src\main\resources\application.yaml"') do if not defined DB_PASS set "DB_PASS=%%b"
for %%p in (!DB_PASS!) do set "DB_PASS=%%~p"
set "DB_PORT=5433"
set "PGPASSWORD=!DB_PASS!"
set "PGCLIENTENCODING=UTF8"

echo.
echo ===============================================
echo   ACADEMIA JAIME GALLARDO - arrancando todo
echo ===============================================
echo.

set "FALTA_REINICIO=0"

rem ---------- 1) Java 21 ----------
echo [1/4] Revisando Java 21...
set "JAVA_OK=0"
where java >nul 2>&1 && (
  for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do set "JV=%%~v"
  for /f "delims=." %%m in ("!JV!") do if %%m GEQ 21 set "JAVA_OK=1"
)
if "!JAVA_OK!"=="0" (
  echo      No hay Java 21. Instalando con winget...
  winget install -e --id Microsoft.OpenJDK.21 --accept-package-agreements --accept-source-agreements
  set "FALTA_REINICIO=1"
) else (
  echo      OK - Java !JV!
)

rem ---------- 2) Node.js ----------
echo [2/4] Revisando Node.js...
where node >nul 2>&1 && (
  for /f %%v in ('node -v') do echo      OK - Node %%v
) || (
  echo      No hay Node. Instalando con winget...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  set "FALTA_REINICIO=1"
)

rem ---------- 3) Docker (la base de datos corre en un contenedor) ----------
echo [3/4] Revisando Docker...
where docker >nul 2>&1 || (
  echo      No hay Docker. Instalando Docker Desktop con winget...
  winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
  set "FALTA_REINICIO=1"
)

if "!FALTA_REINICIO!"=="1" (
  echo.
  echo  Se instalaron cosas nuevas. CIERRA esta ventana y vuelve a darle doble clic
  echo  a INICIAR.bat para que Windows reconozca Java/Node/Docker en el PATH.
  exit /b 0
)

docker info >nul 2>&1
if errorlevel 1 (
  echo      Abriendo Docker Desktop...
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
)
set /a N=0
:esperaDocker
docker info >nul 2>&1
if not errorlevel 1 goto dockerListo
set /a N+=1
if !N! GEQ 60 (
  echo  [X] Docker Desktop no arranco. Abrelo a mano y vuelve a correr INICIAR.bat
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto esperaDocker
:dockerListo
echo      OK - Docker listo

rem ---------- 4) Base de datos en Docker ----------
rem La primera vez el contenedor carga database\academia_jaime_gallardo_db.sql solo.
echo [4/4] Levantando la base de datos (PostgreSQL 16 en Docker, puerto %DB_PORT%)...
docker compose up -d --remove-orphans db
if errorlevel 1 ( echo  [X] No se pudo levantar el contenedor de la base. & exit /b 1 )
set /a N=0
:esperaBase
docker compose exec -T db pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>&1
if not errorlevel 1 goto baseLista
set /a N+=1
if !N! GEQ 40 ( echo  [X] La base no respondio. Revisa: docker compose logs db & exit /b 1 )
timeout /t 3 /nobreak >nul
goto esperaBase
:baseLista
docker compose exec -T db psql -U %DB_USER% -d %DB_NAME% -tAc "select count(*) from information_schema.tables where table_schema='public'" > "%TEMP%\ajg_tablas.txt" 2>nul
set /p TABLAS=<"%TEMP%\ajg_tablas.txt"
echo      OK - base lista con !TABLAS! tablas

rem ---------- Arrancar ----------
echo.
echo Arrancando backend ^(puerto 8080^) en otra ventana...
start "Backend - Spring Boot" cmd /c "cd /d "%~dp0backend" && gradlew.bat bootRun --no-daemon <nul > "%~dp0backend.log" 2>&1"

if not exist "frontend\node_modules" (
  echo Instalando dependencias del frontend ^(solo la primera vez^)...
  pushd frontend & call npm install --no-audit --no-fund & popd
)
echo Arrancando frontend ^(puerto 5173^) en otra ventana...
start "Frontend - Vite" cmd /c "cd /d "%~dp0frontend" && npm run dev <nul > "%~dp0frontend.log" 2>&1"

echo.
echo Esperando a que el backend levante...
set /a N=0
:esperar
timeout /t 3 /nobreak >nul
set /a N+=1
powershell -NoProfile -Command "try{(Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/health -TimeoutSec 2)|Out-Null;exit 0}catch{if($_.Exception.Response){exit 0};exit 1}" >nul 2>&1
if errorlevel 1 if !N! LSS 60 goto esperar

start "" http://localhost:5173
echo.
echo ===============================================
echo   LISTO:  http://localhost:5173
echo   Docente: lucia.fernandez@academiajaimegallardo.com / clave123
echo   Para apagar: cierra las ventanas Backend y Frontend ^(la base sigue en Docker^).
echo   Apagar la base: docker compose stop   ^|   Base limpia: docker compose down -v
echo ===============================================
