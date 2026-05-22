const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDb = require('./db');

const app = express();
const port = process.env.PORT || 3000;

connectDb();

app.use(cors({
origin:['http://localhost:4200'],
methods:['GET','POST','PUT','DELETE','OPTIONS'],
allowedHeaders:['Content-Type','Authorization']
}));

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));

app.use((req,res,next)=>{
res.setTimeout(120000,()=>{
console.log('TIMEOUT',req.method,req.url);
res.status(408).json({
sucesso:false,
erro:'Timeout no processamento do pedido'
});
});
next();
});

app.use((req,res,next)=>{
console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
next();
});

app.get('/api/health',(req,res)=>{
res.status(200).json({
sucesso:true,
mensagem:'API operacional'
});
});

app.use('/api/entidades',require('./routes/entidadeRoutes'));
app.use('/api/periodos',require('./routes/periodoRoutes'));
app.use('/api/documentos',require('./routes/documentoRoutes'));
app.use('/api/unidades-medida',require('./routes/unidadeMedidaRoutes'));
app.use('/api/fatores-conversao',require('./routes/fatorConversaoRoutes'));
app.use('/api/metricas',require('./routes/metricaRoutes'));
app.use('/api/dados',require('./routes/dadoRoutes'));
app.use('/api/kpis',require('./routes/kpiRoutes'));
app.use('/api/kpi-composicoes',require('./routes/kpiComposicaoRoutes'));
app.use('/api/resultados-kpi',require('./routes/resultadoKpiRoutes'));
app.use('/api/resultado-kpi-dados',require('./routes/resultadoKpiDadoRoutes'));
app.use('/api/ia',require('./routes/iaRoutes'));
app.use('/api/exportar',require('./routes/exportRoutes'));

app.use((req,res)=>{
res.status(404).json({
sucesso:false,
erro:'Rota não encontrada'
});
});

app.use((err,req,res,next)=>{
console.error(err);
res.status(500).json({
sucesso:false,
erro:err.message||'Erro interno'
});
});

app.listen(port,()=>{
console.log(`Server running http://localhost:${port}`);
});