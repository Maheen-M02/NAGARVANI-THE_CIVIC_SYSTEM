@echo off
echo Clearing React build cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist build rmdir /s /q build
echo Cache cleared!
echo Please restart your development server (npm start)
pause
