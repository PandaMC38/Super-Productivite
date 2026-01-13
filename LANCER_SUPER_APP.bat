:: =======================================
:: 1. LANCEMENT ECRAN DE CHARGEMENT
:: =======================================
start mshta "%~dp0loading.hta"

:: =======================================
:: 2. VERIFICATION & INSTALLATION (Si besoin)
:: =======================================
if not exist "node_modules" (
    echo Installation des dependances...
    call npm install >nul 2>&1
)

:: =======================================
:: 3. FERMETURE ECRAN CHARGEMENT
:: =======================================
:: On attend 1 seconde pour être sur que c'est visible
timeout /t 1 /nobreak >nul
taskkill /F /FI "WINDOWTITLE eq SUPER_PROD_SPLASH" >nul 2>&1

:: =======================================
:: 4. DEMARRAGE APPLICATION
:: =======================================
npm start

:: Si erreur
if %errorlevel% neq 0 pause
