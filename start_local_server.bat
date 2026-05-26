@echo off
cd /d "%~dp0"
echo Starting local server for Project S website...
echo.
echo If a browser does not open automatically, go to:
echo http://localhost:8080
echo.
start "" http://localhost:8080
py -3 -m http.server 8080
pause
