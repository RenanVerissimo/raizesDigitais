-- Execute uma vez, antes de iniciar o backend atualizado.
ALTER TABLE animais
    ADD COLUMN vaca_vazia TINYINT(1) NOT NULL DEFAULT 0 AFTER nao_emprenha;

-- No formato anterior, os quatro indicadores zerados representam Vaca Vazia.
-- Registros com valores desconhecidos (NULL) ou conflitantes ficam para revisão.
UPDATE animais
SET vaca_vazia = 1
WHERE id_animal > 0
  AND vaca_vazia = 0
  AND prenha = 0
  AND em_cio = 0
  AND abortou = 0
  AND nao_emprenha = 0;
