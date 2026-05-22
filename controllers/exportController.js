const ResultadoKPI = require('../models/resultadoKpiModel'); // O teu modelo da tabela resultadokpi
const KPI = require('../models/kpiModel');
const Periodo = require('../models/periodoModel');
const Entidade = require('../models/entidadeModel');
const Dado = require('../models/dadoModel');
const Documento = require('../models/documentoModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Gerar documento Outbound estruturado filtrado por PERÍODO
// @route   GET /api/exportar/outbound/:id_periodo
const gerarOutboundPorPeriodo = async (req, res) => {
    try {
        const { id_periodo } = req.params;

        // 1. Ir buscar o Período raiz para a secção "meta"
        const periodo = await Periodo.findOne({ id_periodo });
        if (!periodo) {
            return res.status(404).json({ sucesso: false, mensagem: `Período '${id_periodo}' não encontrado.` });
        }

        // 2. Buscar TODOS os resultados de KPI calculados para este período específico
        const resultadosBD = await ResultadoKPI.find({ id_periodo });
        if (!resultadosBD || resultadosBD.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Não foram encontrados resultados de KPI processados para o período ${id_periodo}.` 
            });
        }

        // Carregar listas auxiliares em paralelo para fazer o cruzamento rápido em memória (visto não usarmos ObjectIds/Populate)
        const [kpis, unidades, entidades, dadosBrutos] = await Promise.all([
            KPI.find(),
            UnidadeMedida.find(),
            Entidade.find(),
            Dado.find({ id_periodo }) // Dados brutos deste período para mapear os documentos
        ]);

        // Vamos identificar qual a entidade principal deste período (assumindo o contexto do relatório)
        // Se houver várias, o mapeamento por KPI tratará disso, mas para a "meta", usamos a do primeiro resultado
        const idEntidadePrincipal = resultadosBD[0].id_entidade;
        const entidadePrincipal = entidades.find(e => e.id_entidade === idEntidadePrincipal);

        // 3. Construir o array resultados_kpi cruzando a informação que guardaste no mongosh
        const resultadosKpiFormatados = [];

        for (const resBD of resultadosBD) {
            // Encontrar as definições estruturais do KPI
            const kpiDef = kpis.find(k => k.id_kpi === resBD.id_kpi);
            const unidadeDef = kpiDef ? unidades.find(u => u.id_unidade === kpiDef.id_unidade_resultado) : null;
            
            // Descobrir quais os dados brutos (tabela Dado) que pertencem a este KPI e período
            // Se guardaste o array de dados_origem diretamente no mongosh, usamos esse. Caso contrário, filtramos pela fórmula
            let dadosOrigemIds = resBD.dados_origem || [];
            if (dadosOrigemIds.length === 0 && kpiDef && kpiDef.formula) {
                dadosOrigemIds = dadosBrutos
                    .filter(d => kpiDef.formula.includes(d.id_metrica) && d.id_entidade === resBD.id_entidade)
                    .map(d => d.id_dado);
            }

            resultadosKpiFormatados.push({
                id_resultado: resBD.id_resultado || `res_${resBD._id}`,
                id_kpi: resBD.id_kpi,
                nome_kpi: kpiDef ? kpiDef.nome : "KPI Personalizado",
                norma_referencia: kpiDef ? (kpiDef.norma_referencia || "ESRS / GHG Protocol") : "N/A",
                id_unidade: kpiDef ? kpiDef.id_unidade_resultado : "N/A",
                unidade_legivel: unidadeDef ? `${unidadeDef.nome} (${unidadeDef.simbolo})` : "Unidade Não Mapeada",
                valor_calculado: resBD.valor_calculado, // O valor real vindo da tua tabela do mongosh!
                id_entidade: resBD.id_entidade,
                id_periodo: resBD.id_periodo,
                data_calculo: resBD.data_calculo || resBD.createdAt || new Date().toISOString(),
                estado_validacao: resBD.estado_validacao || "VALIDADO",
                dados_origem: dadosOrigemIds,
                data_validacao: resBD.data_validacao || null,
                snapshot_formula: kpiDef ? kpiDef.formula : "Fórmula Customizada / Direta"
            });
        }

        // 4. Mapear o Documento Relacionado (vamos buscar o documento associado aos dados brutos deste período)
        let docMeta = { id_documento: "N/A", tipo_documento: "CONSOLIDADO_PERIODO", numero_documento: "N/A", data_emissao: null, fonte_ingestao: "SISTEMA", ficheiro_origem: "N/A" };
        if (dadosBrutos.length > 0 && dadosBrutos[0].id_documento) {
            const documentoReal = await Documento.findOne({ id_documento: dadosBrutos[0].id_documento });
            if (documentoReal) {
                docMeta = {
                    id_documento: documentoReal.id_documento,
                    tipo_documento: documentoReal.tipo_documento || "FATURA",
                    numero_documento: documentoReal.numero_documento || "N/A",
                    data_emissao: documentoReal.data_emissao ? documentoReal.data_emissao.toISOString().split('T')[0] : null,
                    fonte_ingestao: documentoReal.fonte_ingestao || "IMPORTACAO",
                    ficheiro_origem: documentoReal.ficheiro_origem || "origem.pdf"
                };
            }
        }

        // 5. Montar a Estrutura Final Exata que pediste
        const documentoOutbound = {
            meta: {
                documento: docMeta,
                entidade: {
                    id_entidade: idEntidadePrincipal,
                    nome: entidadePrincipal ? entidadePrincipal.nome : "Metalogalva",
                    tipo_entidade: entidadePrincipal ? entidadePrincipal.tipo_entidade : "INDUSTRIAL",
                    pais: entidadePrincipal ? (entidadePrincipal.pais || "PT") : "PT"
                },
                periodo: {
                    id_periodo: periodo.id_periodo,
                    tipo_periodo: periodo.tipo_periodo || "MENSAL",
                    data_inicio: periodo.data_inicio ? periodo.data_inicio.toISOString().split('T')[0] : null,
                    data_fim: periodo.data_fim ? periodo.data_fim.toISOString().split('T')[0] : null
                },
                versao_schema: "1.0.0"
            },
            resultados_kpi: resultadosKpiFormatados
        };

        res.status(200).json(documentoOutbound);

    } catch (error) {
        console.error("🔥 ERRO NO PIPELINE OUTBOUND POR PERÍODO:", error);
        res.status(500).json({ sucesso: false, erro: "Erro ao gerar o ficheiro consolidado do período." });
    }
};

module.exports = {
    gerarOutboundPorPeriodo
};