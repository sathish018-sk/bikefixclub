@echo off
title BikeFix Club Launcher
echo ====================================================
echo   BikeFix Club — Starting Local Servers
echo ====================================================
echo.

REM 1. Launch Backend PHP Server on Port 8000
echo [1/2] Starting PHP Backend Server on http://127.0.0.1:8000 ...
start "BikeFix Club Backend (PHP :8000)" cmd /k "cd /d "%~dp0" && "V:\xampp\php\php.exe" -S 127.0.0.1:8000 -t backend/public"

REM Small pause to allow backend to bind port
timeout /t 2 /nobreak >nul

REM 2. Launch Frontend Vite Server on Port 5173
echo [2/2] Starting Frontend Vite Server on http://localhost:5173 ...
start "BikeFix Club Frontend (Vite :5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo   Both servers have been launched in separate windows!
echo   - Frontend: http://localhost:5173
echo   - Backend API: http://127.0.0.1:8000
echo.
echo   Press any key to close this launcher window...
echo ====================================================
pause >nul
