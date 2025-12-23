# Instruções: Remover Rotas Antigas do server/api.js

As seguintes seções de código devem ser removidas ou comentadas no arquivo `server/api.js` pois as tabelas correspondentes foram eliminadas:

## Seções a Remover:

1. **Linhas 3498-3602**: Rotas `/api/user-to-cloud` (GET, POST, PUT, DELETE)
2. **Linhas 3603-3707**: Rotas `/api/user-to-onpremise` (GET, POST, PUT, DELETE)
3. **Linhas 3708-3812**: Rotas `/api/cloud-to-cloud` (GET, POST, PUT, DELETE)
4. Buscar e remover também: `/api/onpremise-to-cloud` e `/api/onpremise-to-onpremise`

## Motivo

Essas tabelas foram unificadas na tabela `integracoes` com os novos campos:
- `tipo_integracao` (ENUM com 5 valores)
- `tipo_dispositivo`
- `nome_dispositivo`
- `aplicacao_origem_id`
- `aplicacao_destino_id`
- `comunicacao_id`
- `tipo_autenticacao`
- `periodicidade`
- `frequencia_uso`

Todas as funcionalidades agora são gerenciadas através da rota `/api/integracoes`.
