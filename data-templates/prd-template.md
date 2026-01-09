# Product Requirements Document - Template

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Projeto:** [Nome do Projeto]

---

## 1. REQUISITOS FUNCIONAIS

### RF001 - [Nome do Módulo/Funcionalidade]

#### RF001.1 - [Nome da Funcionalidade Específica]
**Descrição:** [Descrição detalhada do que o sistema deve fazer]

**Critérios de Aceitação:**
- [Critério 1]
- [Critério 2]
- [Critério 3]

**Prioridade:** [Alta/Média/Baixa]  
**Complexidade:** [Alta/Média/Baixa]

#### RF001.2 - [Outra Funcionalidade]
**Descrição:** [Descrição]

**Critérios de Aceitação:**
- [Critério 1]
- [Critério 2]

**Prioridade:** [Alta/Média/Baixa]

---

### RF002 - [Outro Módulo]

#### RF002.1 - [Funcionalidade]
**Descrição:** [Descrição]

**Critérios de Aceitação:**
- [Critério 1]

**Prioridade:** [Alta/Média/Baixa]

---

## 2. REQUISITOS NÃO-FUNCIONAIS

### RNF001 - Performance

#### RNF001.1 - Tempo de Resposta
**Descrição:** O sistema deve responder rapidamente às ações do usuário.

**Critérios:**
- Operações comuns: < 2 segundos
- APIs: < 1 segundo
- Upload de arquivos: < 10 segundos

**Prioridade:** Alta

#### RNF001.2 - Capacidade
**Descrição:** O sistema deve suportar volume esperado de usuários.

**Critérios:**
- Suportar [X] usuários simultâneos
- Processar [Y] transações por dia

**Prioridade:** Alta

---

### RNF002 - Segurança

#### RNF002.1 - Autenticação
**Descrição:** O sistema deve garantir acesso seguro.

**Critérios:**
- Autenticação via SSO/SAML 2.0
- Suporte a MFA
- Controle de acesso baseado em perfis

**Prioridade:** Alta

#### RNF002.2 - Criptografia
**Descrição:** O sistema deve proteger dados sensíveis.

**Critérios:**
- Dados em trânsito: TLS 1.3
- Dados em repouso: AES-256
- Certificados SSL válidos

**Prioridade:** Alta

---

### RNF003 - Usabilidade

#### RNF003.1 - Interface
**Descrição:** O sistema deve ter interface intuitiva.

**Critérios:**
- Design responsivo (desktop, tablet, mobile)
- Navegação máxima de 3 cliques
- Tempo de aprendizado < 2 horas

**Prioridade:** Alta

#### RNF003.2 - Acessibilidade
**Descrição:** O sistema deve ser acessível.

**Critérios:**
- Conformidade WCAG 2.1 nível AA
- Navegação completa por teclado
- Compatibilidade com leitores de tela

**Prioridade:** Média

---

## 3. REQUISITOS DE DADOS

### RD001 - Integridade de Dados

#### RD001.1 - Validação
**Descrição:** O sistema deve garantir integridade dos dados.

**Critérios:**
- Constraints de banco adequados
- Validação em múltiplas camadas
- Transações ACID

**Prioridade:** Alta

---

## 4. MATRIZ DE RASTREABILIDADE

| ID Requisito | Tipo | Prioridade | Complexidade | Fase |
|--------------|------|------------|--------------|------|
| RF001.1-RF001.2 | Funcional | Alta | Média | Fase 1 |
| RF002.1 | Funcional | Alta | Média | Fase 1 |
| RNF001.1-RNF001.2 | Não Funcional | Alta | Alta | Fase 1 |
| RNF002.1-RNF002.2 | Não Funcional | Alta | Alta | Fase 1 |
| RNF003.1-RNF003.2 | Não Funcional | Alta-Média | Média | Fase 2 |
| RD001.1 | Dados | Alta | Média | Fase 1 |

---

## 5. GLOSSÁRIO

**[Termo 1]:** [Definição]  
**[Termo 2]:** [Definição]  
**[Termo 3]:** [Definição]

---

**Fim do Documento**
