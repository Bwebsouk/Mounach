@echo off
cd /d C:\bwebsouk

echo.
echo * Étape 1 : Ajout des fichiers *
git add .

echo.
echo * Étape 2 : Commit automatique *
git commit -m "Déploiement auto"

echo.
echo * Étape 3 : Push vers GitHub *
git push

echo.
echo * Étape 4 : Lancement du site en local *
start http://127.0.0.1:8080
http-server -p 8080

pause