const path = require("node:path");

process.env.NODE_ENV = "production";
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });

async function iniciar() {
    const obrigatorias = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
    const ausentes = obrigatorias.filter((nome) => !process.env[nome]?.trim());
    if (ausentes.length) {
        console.error(`Configure as variáveis de ambiente antes de iniciar: ${ausentes.join(", ")}.`);
        process.exitCode = 1;
        return;
    }

    const pool = require("../database/conecction");
    try {
        // Confere a conexão e as colunas usadas pelo cadastro, sem alterar registros.
        await pool.query(`
            SELECT id_animal, usuario_id,
                vaca_vazia, prenha, em_cio, abortou, nao_emprenha,
                data_reproducao, data_inseminacao, data_confirmacao_prenhez,
                mastite, doente, doenca, descricao_doenca, tratamento_mastite,
                parasitas, tipo_parasita, data_identificacao, observacoes_saude,
                data_inicio_tratamento, data_fim_tratamento
            FROM animais LIMIT 0
        `);

        require("../server");
    } catch (erro) {
        if (erro.code === "ER_BAD_FIELD_ERROR" || erro.code === "ER_NO_SUCH_TABLE") {
            console.error("Atualize a tabela animais com as colunas de saúde e reprodução antes de iniciar o backend. Consulte backend/README.md.");
        } else {
            console.error(`Não foi possível iniciar o backend (${erro.code || erro.name}). Confira a configuração e a disponibilidade do MySQL.`);
        }
        await pool.end();
        process.exitCode = 1;
    }
}

iniciar();
