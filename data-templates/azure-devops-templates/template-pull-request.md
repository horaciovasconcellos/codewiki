# Template de Pipeline - Pull Request

## 📋 Descrição
Este template é usado para validar Pull Requests antes do merge nas branches principais (`main` e `develop`).

## 🎯 Objetivo
Garantir a qualidade do código através de:
- Build automatizado
- Execução de testes
- Análise de qualidade de código
- Verificação de segurança

---

## 🔄 Fluxo do Pipeline

### Stage 1: Build
**Objetivo**: Compilar a aplicação e instalar dependências

**Steps**:
1. Checkout do código
2. Configurar Node.js (versão 18.x)
3. Instalar dependências (`npm ci`)
4. Executar build (`npm run build`)
5. Publicar artefatos de build

**Estimativa**: 3-5 minutos

---

### Stage 2: Testes
**Objetivo**: Validar funcionalidades através de testes automatizados

**Steps**:
1. Testes unitários (`npm run test:unit`)
2. Testes de integração (`npm run test:integration`)
3. Geração de relatório de cobertura
4. Publicação dos resultados

**Critérios de Sucesso**:
- Cobertura mínima: 80%
- Todos os testes devem passar

**Estimativa**: 5-10 minutos

---

### Stage 3: Qualidade de Código
**Objetivo**: Análise estática e verificação de padrões

**Ferramentas**:
- **ESLint**: Análise de código JavaScript/TypeScript
- **Prettier**: Verificação de formatação
- **TypeScript**: Type checking
- **SonarQube**: Análise de qualidade (opcional)

**Steps**:
1. `npm run lint` - Executar ESLint
2. `npm run prettier:check` - Verificar formatação
3. `npm run type-check` - Validar tipos TypeScript

**Estimativa**: 2-3 minutos

---

### Stage 4: Segurança
**Objetivo**: Identificar vulnerabilidades

**Verificações**:
- npm audit (vulnerabilidades em dependências)
- Scan de segurança (opcional: Snyk, Dependabot)

**Steps**:
1. `npm audit --audit-level=high`
2. Executar scans de segurança adicionais

**Estimativa**: 2-3 minutos

---

### Stage 5: Validação Final
**Objetivo**: Verificações finais antes da aprovação

**Validações**:
- Tamanho do PR (recomendado < 50 arquivos)
- Presença de testes para código novo
- Comentários em código complexo

**Estimativa**: 1 minuto

---

## ⚙️ Configurações

### Variáveis de Ambiente
| Variável | Valor | Descrição |
|----------|-------|-----------|
| `nodeVersion` | `18.x` | Versão do Node.js |
| `buildConfiguration` | `Release` | Tipo de build |

### Pool de Agentes
- **VM Image**: `ubuntu-latest`
- **OS**: Linux

### Triggers
```yaml
trigger: none  # Não executar em commits diretos

pr:
  branches:
    include:
      - main
      - develop
      - release/*
  paths:
    exclude:
      - docs/*
      - README.md
      - .gitignore
```

---

## 📊 Métricas e Relatórios

### Relatórios Gerados
1. **Test Results**: Resultados dos testes (JUnit format)
2. **Code Coverage**: Cobertura de código (Cobertura format)
3. **Lint Report**: Análise de código estático

### Visualização
- Resultados disponíveis na aba **Tests** do PR
- Cobertura visualizada na aba **Code Coverage**
- Comentários automáticos no PR (opcional)

---

## ✅ Critérios de Aprovação

Para que o pipeline seja bem-sucedido:
- ✅ Build completado sem erros
- ✅ Todos os testes passaram
- ✅ Cobertura de código >= 80%
- ✅ Nenhum erro de lint
- ✅ Nenhuma vulnerabilidade crítica
- ✅ Code review aprovado (manual)

---

## 🚫 Falhas Comuns

### Build Failure
**Causa**: Erros de compilação
**Solução**: Verificar logs de build, corrigir erros de sintaxe

### Test Failures
**Causa**: Testes falhando
**Solução**: Executar testes localmente, corrigir falhas

### Lint Errors
**Causa**: Código não segue padrões
**Solução**: Executar `npm run lint:fix`

### Coverage Below Threshold
**Causa**: Cobertura insuficiente
**Solução**: Adicionar testes para código não coberto

---

## 🔧 Manutenção

### Atualização do Template
1. Editar arquivo localmente
2. Testar em branch de feature
3. Fazer upload do template atualizado
4. Validar em próximo PR

### Versionamento
- **Versão Atual**: 1.0.0
- **Última Atualização**: 29/12/2025
- **Responsável**: DevOps Team

---

## 📚 Referências

- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)
- [YAML Schema Reference](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema)
- [Best Practices for CI/CD](https://docs.microsoft.com/azure/devops/pipelines/build/triggers)

---

## 💡 Dicas

1. **Mantenha PRs pequenos**: PRs menores são mais fáceis de revisar e têm pipeline mais rápido
2. **Execute testes localmente**: Antes de criar PR, execute `npm test` localmente
3. **Use cache**: Configure cache para node_modules para acelerar builds
4. **Monitore tempo de execução**: Se pipeline demora > 15 min, considere otimizações

---

## 📞 Suporte

Em caso de problemas com o pipeline:
- **Equipe DevOps**: devops@empresa.com
- **Documentação**: [Link para wiki interna]
- **Chat**: #devops-support no Slack
