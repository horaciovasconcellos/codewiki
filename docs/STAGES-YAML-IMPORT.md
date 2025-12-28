# Importação de YAML em Stages

## 📋 Visão Geral

O **Stage Wizard** agora suporta importação e validação de arquivos YAML, permitindo que você configure stages rapidamente a partir de definições existentes.

## 🎯 Funcionalidades

### 1. Upload de Arquivo YAML
- Botão "Upload YAML" para carregar arquivos `.yaml` ou `.yml`
- Suporte a drag-and-drop (futuro)

### 2. Editor de YAML Inline
- Campo de texto editável com syntax highlighting
- Validação em tempo real
- Mensagens de erro detalhadas

### 3. Validação Automática
- ✅ Valida sintaxe YAML
- ✅ Verifica estrutura do documento
- ⚠️ Avisos para estruturas não reconhecidas
- ❌ Erros para YAML inválido

### 4. Mapeamento Automático de Campos
O sistema reconhece e mapeia automaticamente os seguintes campos:

| Campo YAML | Campo do Formulário | Obrigatório |
|------------|---------------------|-------------|
| `name` ou `nome` | Nome | Sim |
| `type` ou `tipo` | Tipo | Sim |
| `description` ou `descricao` | Descrição | Não |
| `timeout` ou `timeoutSeconds` | Timeout (segundos) | Não |
| `reusable` ou `reutilizavel` | Stage reutilizável | Não |

## 📝 Estrutura YAML Suportada

### Estrutura Básica

```yaml
name: Nome do Stage
type: Build  # Build, Test, Security, Deploy, Quality, Notification, Custom
description: Descrição detalhada do stage
timeout: 3600
reusable: true
```

### Estrutura Completa (com steps opcionais)

```yaml
name: Build and Test
type: Build
description: |
  Compila o código e executa testes
  Gera artefatos para deploy
timeout: 3600
reusable: true

# Campos opcionais (não mapeados para o formulário)
steps:
  - name: Checkout
    uses: actions/checkout@v3
  
  - name: Build
    run: npm run build

env:
  NODE_ENV: production
```

## 🚀 Como Usar

### Opção 1: Upload de Arquivo

1. Acesse **DevSecOps > Stages**
2. Clique em "Novo Stage"
3. Na seção "Importar configuração YAML", clique em **"Upload YAML"**
4. Selecione um arquivo `.yaml` ou `.yml`
5. O sistema validará e preencherá automaticamente os campos
6. Edite os campos conforme necessário
7. Clique em "Salvar"

### Opção 2: Colar YAML Diretamente

1. Acesse **DevSecOps > Stages**
2. Clique em "Novo Stage"
3. Cole o conteúdo YAML no campo de texto editável
4. A validação ocorre automaticamente
5. Os campos são preenchidos em tempo real
6. Edite conforme necessário
7. Clique em "Salvar"

## 📂 Exemplos de YAML

### Build Stage

```yaml
name: Build and Test
type: Build
description: Compilação do código fonte e testes unitários
timeout: 3600
reusable: true
```

### Deploy Stage

```yaml
name: Deploy to Production
type: Deploy
description: Deploy da aplicação para ambiente de produção
timeout: 1800
reusable: false
```

### Security Stage

```yaml
name: Security Analysis
type: Security
description: Análise de vulnerabilidades e segurança do código
timeout: 2400
reusable: true
```

### Test Stage

```yaml
name: Integration Tests
type: Test
description: Testes de integração end-to-end
timeout: 2400
reusable: true
```

### Quality Stage

```yaml
name: Code Quality Check
type: Quality
description: Análise de qualidade de código com SonarQube
timeout: 1200
reusable: true
```

## ⚠️ Validações

### Erros Comuns

1. **YAML inválido: deve conter um objeto**
   - Solução: Certifique-se de que o YAML contém um objeto válido, não apenas texto

2. **Erro ao validar YAML: [mensagem específica]**
   - Solução: Verifique a sintaxe YAML (indentação, dois pontos, aspas)

3. **Aviso: YAML não contém campos reconhecidos**
   - O YAML é válido mas não contém `name`, `type` ou outros campos esperados
   - Você pode continuar mas precisará preencher os campos manualmente

### Tipos de Stage Válidos

- `Build`
- `Test`
- `Security`
- `Deploy`
- `Quality`
- `Notification`
- `Custom`

## 🔄 Edição de YAML Importado

Após a importação, você pode:

1. ✅ **Editar todos os campos do formulário**
   - Nome, Tipo, Descrição, Timeout, Reutilizável

2. ✅ **Modificar o YAML diretamente**
   - O campo de texto permanece editável
   - Mudanças são validadas em tempo real

3. ✅ **Importar novamente**
   - Faça upload de outro arquivo para substituir os dados

## 📊 Indicadores Visuais

### Status de Validação

- ✅ **Verde com ícone de check**: YAML válido e campos mapeados
- ⚠️ **Amarelo com aviso**: YAML válido mas sem campos reconhecidos
- ❌ **Vermelho com erro**: YAML inválido ou com erro de sintaxe

## 💡 Dicas

1. **Use campos em inglês ou português**
   - Sistema reconhece ambos: `name`/`nome`, `type`/`tipo`, `description`/`descricao`

2. **Mantenha estrutura simples**
   - Campos extras (como `steps`, `env`) são ignorados mas não causam erro

3. **Valide antes de salvar**
   - Aguarde o indicador verde antes de clicar em "Salvar"

4. **Reutilize configurações**
   - Exporte YAMLs de stages existentes para reusar

## 🔗 Arquivos de Exemplo

Confira os exemplos prontos em:
- `examples/stage-example.yaml` - Build completo
- `examples/stage-deploy.yaml` - Deploy
- `examples/stage-security.yaml` - Security scan

## 🐛 Troubleshooting

### YAML não é importado

1. Verifique se o arquivo tem extensão `.yaml` ou `.yml`
2. Abra o arquivo em editor de texto e valide a sintaxe
3. Teste colando o conteúdo diretamente no campo de texto

### Campos não são preenchidos

1. Verifique se os campos têm os nomes corretos
2. Use `name`/`nome`, `type`/`tipo`, etc.
3. O tipo deve ser um dos valores válidos

### Erro de validação persistente

1. Copie o YAML para um validador online (yamllint.com)
2. Corrija problemas de indentação
3. Remova caracteres especiais invisíveis

---

**Última Atualização:** 27 de dezembro de 2024
