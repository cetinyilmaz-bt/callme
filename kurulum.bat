@echo off
chcp 65001 >nul
title CallMee - Kurulum
echo ========================================================
echo          CallMee - Bagimliliklar Kuruluyor...
echo ========================================================
echo.
call npm.cmd install
echo.
echo ========================================================
echo Kurulum tamamlandi! 'baslat.bat' dosyasina tiklayarak calistirabilirsiniz.
echo ========================================================
pause
