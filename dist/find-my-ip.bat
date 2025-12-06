@echo off
echo ========================================
echo   Find Your Computer's IP Address
echo ========================================
echo.
echo This will show your computer's IP address on the network.
echo.
echo Press any key to continue...
pause >nul
echo.

REM Get IP addresses
echo ========================================
echo   Your IP Address(es):
echo ========================================
echo.

REM Use ipconfig and filter for IPv4 addresses
ipconfig | findstr /C:"IPv4" /C:"IPv4 Address"

echo.
echo ========================================
echo   How to Use This IP Address:
echo ========================================
echo.
echo 1. Look for the IP address above (usually starts with 192.168. or 10.)
echo 2. Write it down or remember it
echo 3. On another computer on the same network, open a web browser
echo 4. Type: http://[YOUR_IP]:8500
echo    (Replace [YOUR_IP] with the IP address you found)
echo.
echo Example: If your IP is 192.168.1.100, type:
echo          http://192.168.1.100:8500
echo.
echo ========================================
echo   Important Notes:
echo ========================================
echo.
echo - Make sure the server is running on this computer
echo - Make sure the firewall port is open (run open-firewall-port.bat)
echo - Both computers must be on the same Wi-Fi/Ethernet network
echo - The IP address may change if you disconnect/reconnect to the network
echo.
pause




