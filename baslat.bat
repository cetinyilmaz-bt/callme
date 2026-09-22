@echo off
chcp 65001 >nul
title CallMee - Cagri Sistemi
echo ========================================================
echo               CallMee Cagri Sistemi
echo ========================================================
echo.
echo Sunucu baslatiliyor...
echo.
echo Mudur Ekrani   : http://localhost:3000
echo Asistan Ekrani : http://localhost:3000/assistant
echo.
echo Durdurmak icin bu pencereyi kapatabilir veya Ctrl+C yapabilirsiniz.
echo ========================================================
echo.

:: Tarayicida sayfalari otomatik ac
start http://localhost:3000
start http://localhost:3000/assistant

:: Sunucuyu calistir
node server.js
pause
