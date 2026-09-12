# Executar o backend em produção

Configure no servidor `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
`JWT_SECRET` e `PORT`. Também é possível usar o arquivo `backend/.env`, que não
deve ser enviado ao Git. O serviço usa a porta `3001` quando `PORT` não é definida.

A tabela `animais` precisa conter as colunas de saúde e reprodução. A coluna
`vaca_vazia` e a conversão dos registros anteriores estão descritas em
[migrations/20260912_vaca_vazia.sql](migrations/20260912_vaca_vazia.sql).
Execute esse SQL uma vez, se a coluna ainda não existir.

Na pasta `backend`, execute:

```sh
npm ci --omit=dev
npm run start:prod
```

Esse comando define `NODE_ENV=production`, verifica a configuração, conecta ao
MySQL e confere as colunas antes de abrir a API. Cadastro e edição gravam no
banco configurado. `npm test` é uma verificação separada, acionada manualmente.

Na hospedagem, use `backend` como diretório do serviço, `npm ci --omit=dev`
como comando de instalação e `npm run start:prod` como comando de início.
Configure o serviço para reiniciar o processo quando necessário.

No frontend, configure `EXPO_PUBLIC_API_URL` com o endereço HTTPS público do
backend e gere uma nova versão do aplicativo. Um endereço `192.168.x.x` permite
acesso somente na rede local, conforme as regras dessa rede.
