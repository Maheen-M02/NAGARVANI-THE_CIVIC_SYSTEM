@echo off
echo Clearing webpack and npm cache...
echo.

echo [1/3] Clearing webpack cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Webpack cache cleared!
) else (
    echo No webpack cache found.
)
echo.

echo [2/3] Clearing npm cache...
npm cache clean --force
echo.

echo [3/3] Done!
echo.
echo Please restart your dev server:
echo   1. Stop the current server (Ctrl+C)
echo   2. Run: npm start
echo.
pause
