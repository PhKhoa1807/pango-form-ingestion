@echo off
REM ============================================================
REM  Mo Chrome o che do TAT CORS de test app ingest Pango.
REM  CHI dung de TEST. Dung profile rieng nen khong anh huong
REM  Chrome thuong cua ban (khong dang nhap Gmail... o cua so nay).
REM ============================================================

set "APP=%~dp0index.html"
set "PROFILE=%TEMP%\chrome_nocors_vson"

set "CHROME="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

if "%CHROME%"=="" (
  echo Khong tim thay Chrome. Thu dung Edge...
  if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "CHROME=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

if "%CHROME%"=="" (
  echo [LOI] Khong tim thay Chrome lan Edge. Cai Chrome hoac sua duong dan trong file .bat nay.
  pause
  exit /b 1
)

echo Mo: %APP%
echo Profile test: %PROFILE%
start "" "%CHROME%" --disable-web-security --disable-features=IsolateOrigins,site-per-process --user-data-dir="%PROFILE%" "file:///%APP:\=/%"
