# INSTRUÇÕES DE CARGA - SISTEMA DE AUDITORIA

Este documento contém instruções para carga de dados no sistema de auditoria.

## 📚 Documentações por Entidade

### Processos de Negócio
- **Método**: Via Console do Navegador (localStorage)
- **Documentação**: Ver seção "Processos de Negócio" abaixo

### Aplicações
- **Métodos**: Interface Web (Wizard ou Lockfiles), Script Shell, API REST
- **Documentação Completa**: [`data-templates/README-APLICACOES.md`](data-templates/README-APLICACOES.md)
- **Guia Rápido**: Ver seção "Aplicações" abaixo

### Outras Entidades
- **Documentação**: [`data-templates/README-CARGA.md`](data-templates/README-CARGA.md)

---

## 📋 PROCESSOS DE NEGÓCIO

### Passo a Passo (IMPORTANTE: Siga exatamente)

### 1️⃣ Abrir o Sistema
```bash
# Certifique-se que o sistema está rodando
http://localhost:5173
```

### 2️⃣ Abrir o Console do Navegador
- **Chrome/Edge**: Pressione `F12` ou `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: Pressione `F12` ou `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- Clique na aba **Console**

### 3️⃣ Copiar o Script Completo
```bash
# Execute no terminal para ver o script:
cat scripts/carga-processos-browser.js

# Ou abra o arquivo e copie TUDO (Ctrl+A, Ctrl+C):
open scripts/carga-processos-browser.js
```

### 4️⃣ Colar no Console
1. Clique dentro da área do Console
2. Cole o script completo (Ctrl+V ou Cmd+V)
3. Pressione **Enter**
4. Aguarde a mensagem: `✓ SUCESSO!`

### 5️⃣ Recarregar a Página
```
Pressione F5 ou Ctrl+R (Windows) / Cmd+R (Mac)
```

### 6️⃣ Verificar os Dados
1. Acesse o menu **Processos de Negócio**
2. Você deve ver 10 processos carregados
3. Clique em qualquer processo para ver as normas

---

## ✅ Validação Manual

### Verificar no Console (antes de recarregar):
```javascript
// Digite no console:
const dados = JSON.parse(localStorage.getItem('processos-negocio'));
console.log(`Total: ${dados.length} processos`);
console.table(dados.map(p => ({ID: p.identificacao, Desc: p.descricao})));
```

### Verificar na Interface (após recarregar):
- [ ] Menu "Processos de Negócio" visível
- [ ] 10 processos listados
- [ ] Siglas no formato AAAA-00000
- [ ] Ao clicar em um processo, normas aparecem

---

## 🆘 Solução de Problemas

### Problema: Script não cola no console
**Solução**: 
1. Abra o arquivo `scripts/carga-processos-browser.js` em um editor de texto
2. Selecione TUDO (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no console (Ctrl+V)

### Problema: Erro ao executar
**Solução**:
1. Limpe o console (botão 🗑️ ou digite `clear()`)
2. Limpe o localStorage: `localStorage.clear()`
3. Tente novamente

### Problema: Dados não aparecem após F5
**Solução**:
```javascript
// Verificar se os dados estão salvos:
console.log(localStorage.getItem('processos-negocio'));

// Se aparecer "null", execute o script novamente
```

### Problema: Aparecem processos antigos
**Solução**:
```javascript
// Limpar dados antigos:
localStorage.removeItem('processos-negocio');

// Executar o script de carga novamente
// Recarregar a página (F5)
```

---

## 📊 Dados que Serão Carregados

### 10 Processos:
1. **ADMN-00001** - Gestão de Contratos Administrativos (2 normas)
2. **FINA-00001** - Controle de Contas a Pagar (2 normas)
3. **TECH-00001** - Desenvolvimento de Software (2 normas)
4. **SAUDE-00001** - Atendimento Ambulatorial (3 normas)
5. **ELET-00001** - Manutenção de Infraestrutura Elétrica (2 normas)
6. **ACES-00001** - Adequação de Acessibilidade (2 normas)
7. **COME-00001** - Importação e Exportação de Produtos (2 normas)
8. **BANC-00001** - Gestão de Riscos Financeiros (2 normas)
9. **CONT-00001** - Elaboração de Demonstrações Financeiras (2 normas)
10. **SEGU-00001** - Gestão de Incidentes de Segurança (3 normas)

### 22 Normas Distribuídas:
- **7 Normas Técnicas**: ISO 9001, ISO 27001, IEC 62304, NBR 5410, NBR 9050, CPC 00
- **10 Normas Reguladoras**: Lei 8.666, NR-32, NR-10, ANVISA, Lei 13.146, BACEN, Reg. Aduaneiro, CMN, LGPD
- **6 Internacionais**: IFRS 9, GDPR, OMC/WTO, Basel III, IFRS 15

---

## ⚡ Método Rápido (Copiar e Colar)

**Cole isto no console do navegador:**

```javascript
// Verificar se já tem dados
const atual = localStorage.getItem('processos-negocio');
console.log('Dados atuais:', atual ? JSON.parse(atual).length + ' processos' : 'VAZIO');

// Se quiser limpar antes de carregar:
// localStorage.removeItem('processos-negocio');

// Depois cole o conteúdo completo do arquivo carga-processos-browser.js
```

---

**IMPORTANTE**: 
- ✅ O script está CORRETO e VALIDADO
- ✅ Campos compatíveis com a interface TypeScript
- ✅ Pronto para uso imediato
- ⚠️ Não esqueça de **recarregar a página (F5)** após executar!

---

## 🖥️ APLICAÇÕES

### Guia Rápido

Para carga completa de aplicações com todos os relacionamentos, consulte:
**[`data-templates/README-APLICACOES.md`](data-templates/README-APLICACOES.md)**

### Métodos Disponíveis

#### 1. Interface Web - Wizard (Recomendado)
- Acesse: **Aplicações → Nova Aplicação**
- Preencha 8 passos: Básico, Tecnologias, Ambientes, Capacidades, Processos, Integrações, SLAs
- Ideal para: Primeiras aplicações, cadastro manual completo

#### 2. Interface Web - Carga de Lockfiles
- Acesse: **Ferramentas → Carga de Lockfiles**
- Upload de arquivos: `package.json`, `pom.xml`, `requirements.txt`, etc. (29 formatos)
- Ideal para: Detectar tecnologias automaticamente de projetos existentes

#### 3. Script Shell
```bash
cd scripts
./load-aplicacoes.sh ../data-templates/aplicacoes-carga.json
```
- Ideal para: Carga em lote, automação, múltiplas aplicações

#### 4. API REST
```bash
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "CRM",
    "descricao": "Sistema CRM",
    "urlDocumentacao": "https://docs.example.com",
    "tecnologias": [...],
    "ambientes": [...],
    ...
  }'
```
- Ideal para: Integrações, automações customizadas

### Exemplo Rápido

**Criar aplicação simples**:
```bash
cd scripts
cat > /tmp/app-teste.json << 'EOF'
[{
  "sigla": "TESTE",
  "descricao": "Aplicação de Teste",
  "urlDocumentacao": "https://docs.test.com",
  "faseCicloVida": "Desenvolvimento",
  "criticidadeNegocio": "Baixa"
}]
EOF

./load-aplicacoes.sh /tmp/app-teste.json
```

### Campos Obrigatórios
- ✅ `sigla` (max 15 chars, único)
- ✅ `descricao` (max 50 chars)
- ✅ `urlDocumentacao` (URL válida)

### Campos Opcionais
- `faseCicloVida`: Planejamento, Desenvolvimento, Testes, Homologação, **Produção**, Manutenção, Descontinuado
- `criticidadeNegocio`: Muito Baixa, Baixa, **Média**, Alta, Muito Alta

### Relacionamentos (Opcionais)
- **tecnologias**: Array de tecnologias utilizadas
- **ambientes**: Array de ambientes (Dev, QA, Prod, Cloud, On-Premise)
- **capacidades**: Array de capacidades de negócio suportadas
- **processos**: Array de processos de negócio suportados
- **integracoes**: Array de integrações com outras aplicações
- **slas**: Array de SLAs (Service Level Agreements)

### Verificar Aplicações Carregadas
```bash
# Total de aplicações
curl -s http://localhost:3000/api/aplicacoes | jq 'length'

# Listar aplicações
curl -s http://localhost:3000/api/aplicacoes | jq -r '.[] | "\(.sigla) - \(.descricao)"'

# Ver aplicação específica com relacionamentos
curl -s http://localhost:3000/api/aplicacoes/{id} | jq
```

---

## 📚 Documentação Adicional

- **Guia Completo de Aplicações**: [`data-templates/README-APLICACOES.md`](data-templates/README-APLICACOES.md)
- **Guia Geral de Carga**: [`data-templates/README-CARGA.md`](data-templates/README-CARGA.md)
- **Lockfiles Suportados**: [`data-templates/README-IDENTIFICADOR-v1.5.1.md`](data-templates/README-IDENTIFICADOR-v1.5.1.md)
