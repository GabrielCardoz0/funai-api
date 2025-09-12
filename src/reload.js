const fs = require('fs');
const axios = require('axios');

// Lê o arquivo logs.json
fs.readFile('./apilogs.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo logs.json:', err);
    return;
  }

  try {
    const logs = JSON.parse(data);

    console.log(logs.length);

    // Faz o POST na API

    for(const log of logs) {
      axios.post('http://localhost:5000/webhooks', log.body)
        .then(response => {
          console.log('Dados enviados com sucesso:', response.data);
        })
        .catch(error => {
          console.error('Erro ao enviar os dados para a API:', error.message);
        });
    }
  } catch (parseError) {
    console.error('Erro ao parsear o arquivo logs.json:', parseError);
  }
});