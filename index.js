const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDb = require('./db');

const port = process.env.PORT || 3000;
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/entidades', require('./routes/entidadeRoutes'));
app.use('/api/periodos', require('./routes/periodoRoutes'));
app.use('/api/documentos', require('./routes/documentoRoutes'));
app.use('/api/unidades', require('./routes/unidadeRoutes'));
app.use('/api/fatores', require('./routes/fatorRoutes'));
app.use('/api/metricas', require('./routes/metricaRoutes'));
app.use('/api/dados', require('./routes/dadoRoutes'));
app.use('/api/kpis', require('./routes/kpiRoutes'));
app.use('/api/resultados-kpi', require('./routes/resultadoKPIRoutes'));
app.use('/api/ia', require('./routes/iaRoutes'));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});


app.use('/api', require('./routes/iaRoutes'));

app.listen(port, () => {
  connectDb();
  console.log(`Server running at http://localhost:${port}`);
});