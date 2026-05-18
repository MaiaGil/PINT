const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDb = require('./db');

const port = process.env.PORT || 3000;
const app = express();

// Ativação do CORS para permitir a comunicação com o Angular (Porta 4200)
app.use(cors());
app.use(express.json());

// Middleware de Logs para veres os pedidos do Angular no terminal em tempo real
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas Oficiais do Projeto PINT
app.use('/api', require('./routes/entidadeRoutes'));
app.use('/api', require('./routes/periodoRoutes'));
app.use('/api', require('./routes/tipoMaterialRoutes'));
app.use('/api', require('./routes/relatorioRoutes'));
app.use('/api', require('./routes/emissaoCarbonoRoutes'));
app.use('/api', require('./routes/energiaConsumoRoutes'));
app.use('/api', require('./routes/transporteRoutes'));
app.use('/api', require('./routes/energiaMixRoutes'));
app.use('/api', require('./routes/materiaPrimaRoutes'));

// Inicialização do Servidor e Ligação à Base de Dados MongoDB
app.listen(port, () => {
  connectDb();
  console.log(`Server running at http://localhost:${port}`);
});