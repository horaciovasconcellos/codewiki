# 🖨️ Guia Rápido: Testar Impressão

## Como Testar AGORA

### Passo 1: Abrir o Sistema
```
http://localhost:3000
```

### Passo 2: Ir em Documentação de Projetos
Clique no menu **Documentação de Projetos**

### Passo 3: Escolher um Documento
Na tabela, você verá 3 botões por documento:
- 👁️ **Visualizar** (olho)
- 🖨️ **Imprimir** (impressora) ← CLIQUE AQUI
- ✏️ **Editar** (lápis)
- 🗑️ **Excluir** (lixeira)

### Passo 4: Aguardar
Após clicar em **Imprimir**:
1. Dialog de visualização abrirá ✅
2. Aguarde **1 segundo** (automático)
3. Dialog de impressão do navegador abrirá ✅

### Passo 5: Configurar Impressão

#### ⚠️ CONFIGURAÇÃO OBRIGATÓRIA
**Chrome/Edge:**
- Destino: **Salvar como PDF**
- **Mais configurações** → ✅ **Cores de plano de fundo e imagens**

**Firefox:**
- Destino: **Salvar em PDF**
- ✅ **Imprimir planos de fundo**

#### Outras Configurações
- Layout: **Retrato**
- Margens: **Padrão**
- Escala: **100%**

### Passo 6: Salvar PDF
1. Clique em **Salvar**
2. Escolha pasta e nome
3. Abra o PDF gerado

## ✅ O que Deve Aparecer

- ✅ Título grande e negrito
- ✅ Subtítulos hierárquicos
- ✅ Parágrafos formatados
- ✅ Listas com bullets
- ✅ Código com fundo cinza
- ✅ Tabelas com bordas
- ✅ Diagramas Mermaid (se houver)

## ❌ O que NÃO Deve Aparecer

- ❌ Barra lateral
- ❌ Botões
- ❌ Menus
- ❌ Fundo escuro

## 🔧 Se Não Funcionar

### PDF Vazio ou Sem Formatação
**Causa:** "Cores de plano de fundo" desativado  
**Solução:** Volte e ATIVE essa opção

### Conteúdo Cortado
**Causa:** Escala muito baixa  
**Solução:** Aumente para 100% ou 110%

### Mermaid Não Aparece
**Causa:** Renderização incompleta  
**Solução:** 
1. Feche o PDF
2. Clique em Imprimir novamente
3. Aguarde 2-3 segundos extras antes de salvar

### Nada Acontece ao Clicar em Imprimir
**Causa:** JavaScript pode estar desabilitado ou console tem erro  
**Solução:**
1. Abra Console do navegador (F12)
2. Procure por erros em vermelho
3. Recarregue a página (Ctrl+F5)
4. Tente novamente

## 📝 Testando com Documento Novo

Se não houver documentos, crie um teste:

```markdown
# Título de Teste

## Subtítulo

Este é um **teste** de impressão com *formatação*.

### Lista
- Item 1
- Item 2
- Item 3

### Código
```
javascript
function teste() {
  console.log("Olá!");
}
```

### Tabela
| Coluna 1 | Coluna 2 |
|----------|----------|
| A        | B        |
| C        | D        |
```

## 🎯 Resultado Esperado

Ao abrir o PDF, você deve ver uma página branca com:
- Título grande no topo
- Todo conteúdo formatado
- Margens adequadas
- SEM elementos de UI

---

**Se funcionou:** Parabéns! 🎉  
**Se não funcionou:** Me avise qual o problema exato que viu
