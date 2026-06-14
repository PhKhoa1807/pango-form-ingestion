@echo off
REM Khoi dong proxy + app, roi mo trinh duyet.
cd /d "%~dp0"
start "" http://localhost:8787
node proxy.js
pause
