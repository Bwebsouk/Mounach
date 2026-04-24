const https = require('https');
const url = 'https://www.example.com';

https.get(url, (res) => {
  console.log('Statut de la réponse :', res.statusCode);
}).on('error', (e) => {
  console.error('Erreur :', e.message);
});
