const dotenv = require('dotenv-safe');
const path = require('path');

dotenv.config({
  example: path.resolve(process.cwd(), '.env.example'),
  path: path.resolve(process.cwd(), '.env.local'),
  allowEmptyValues: true,
});

console.log('Variáveis de ambiente carregadas com sucesso');
module.exports = { loaded: true };
