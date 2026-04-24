@echo off

echo Creating scraper-pixmania.js with ASCII content...
echo const https = require('https');>scraper-pixmania.js
echo const fs = require('fs');>>scraper-pixmania.js
echo const jsdom = require('jsdom');>>scraper-pixmania.js
echo const { JSDOM } = jsdom;>>scraper-pixmania.js

echo.>>scraper-pixmania.js
echo var url = "https://www.pixmania.fr/p/smartphone-xyz"; >>scraper-pixmania.js
echo.>>scraper-pixmania.js

echo https.get(url, function (res) {>>scraper-pixmania.js
echo^    var data = '';>>scraper-pixmania.js
echo^    res.on('data', function (chunk) { data += chunk; });>>scraper-pixmania.js
echo^    res.on('end', function () {>>scraper-pixmania.js
echo^        var dom = new JSDOM(data);>>scraper-pixmania.js
echo^        var document = dom.window.document;>>scraper-pixmania.js
echo.>>scraper-pixmania.js
echo^        var nom = 'Nom non trouve';>>scraper-pixmania.js
echo^        var nomElement = document.querySelector('.product-title');>>scraper-pixmania.js
echo^        if (nomElement) {>>scraper-pixmania.js
echo^            nom = nomElement.textContent.trim();>>scraper-pixmania.js
echo^        }>>scraper-pixmania.js
echo.>>scraper-pixmania.js
echo^        var prix = 'Prix non trouve';>>scraper-pixmania.js
echo^        var prixElement = document.querySelector('.price');>>scraper-pixmania.js
echo^        if (prixElement) {>>scraper-pixmania.js
echo^            prix = prixElement.textContent.trim();>>scraper-pixmania.js
echo^        }>>scraper-pixmania.js
echo.>>scraper-pixmania.js
echo^        var dispo = 'Disponibilite inconnue';>>scraper-pixmania.js
echo^        var dispoElement = document.querySelector('.stock');>>scraper-pixmania.js
echo^        if (dispoElement) {>>scraper-pixmania.js
echo^            dispo = dispoElement.textContent.trim();>>scraper-pixmania.js
echo^        }>>scraper-pixmania.js
echo.>>scraper-pixmania.js
echo^        var produit = { nom: nom, prix: prix, dispo: dispo, url: url };>>scraper-pixmania.js
echo.>>scraper-pixmania.js
echo^        fs.writeFile('products.json', JSON.stringify(produit, null, 2), function (err) {>>scraper-pixmania.js
echo^            if (err) {>>scraper-pixmania.js
echo^                console.log('Erreur de sauvegarde :', err.message);>>scraper-pixmania.js
echo^            } else {>>scraper-pixmania.js
echo^                console.log('Fichier products.json cree avec succes.');>>scraper-pixmania.js
echo^            }>>scraper-pixmania.js
echo^        });>>scraper-pixmania.js
echo^    });>>scraper-pixmania.js
echo }).on('error', function (e) {>>scraper-pixmania.js
echo^    console.log('Erreur de requete :', e.message);>>scraper-pixmania.js
echo });>>scraper-pixmania.js

echo.>>scraper-pixmania.js
echo Remplacement reussi !
pause