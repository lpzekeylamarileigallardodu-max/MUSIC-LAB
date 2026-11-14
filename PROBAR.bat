@echo off
chcp 65001 >nul
title Academia Jaime Gallardo - Prueba
cd /d "%~dp0"
if not exist "%~dp0pruebas" mkdir "%~dp0pruebas"
set "LOG=%~dp0pruebas\probar.log"
set "C=%TEMP%\ajg_cookie.txt"
set "B=http://localhost:8080"
if not "%~1"=="" set "B=%~1"
echo ==== Prueba contra %B% - %date% %time% ==== > "%LOG%"
docker compose ps db >>"%LOG%" 2>&1
curl.exe -s -o NUL -w "health: HTTP %%{http_code}\n" %B%/api/health >>"%LOG%" 2>&1
curl.exe -s -c "%C%" -H "Content-Type: application/json" -d "{\"correo\":\"admin@academiajaimegallardo.com\",\"password\":\"clave123\"}" -w "\nlogin director: HTTP %%{http_code}\n" %B%/api/auth/login >>"%LOG%" 2>&1
for %%r in (horarios cuotas pagos usuarios cursos) do (
  curl.exe -s -b "%C%" -o "pruebas\prueba_%%r.xlsx" -w "reporte %%r: HTTP %%{http_code} - %%{size_download} bytes\n" %B%/api/admin/reportes/%%r.xlsx >>"%LOG%" 2>&1
)
curl.exe -s -b "%C%" -o NUL -w "tablero de horarios: HTTP %%{http_code}\n" %B%/api/admin/horarios >>"%LOG%" 2>&1
curl.exe -s -b "%C%" -o NUL -w "pagos pendientes: HTTP %%{http_code}\n" %B%/api/admin/pagos-pendientes >>"%LOG%" 2>&1
echo ==== FIN ====>>"%LOG%"
