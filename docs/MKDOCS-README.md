---
title: MkDocs - Referência Rápida
description: Guia de uso e configuração do MkDocs para CodeWiki
date: 12 de Janeiro de 2026
tags:
  - mkdocs
  - documentação
  - setup
---

# 📚 MkDocs - Referência Rápida

> Sistema de documentação usado no projeto CodeWiki

---

## 🚀 Início Rápido

### Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
docker-compose up mkdocs

# Acessar em http://localhost:8082
# Hot reload: alterações são atualizadas automaticamente
```

### Build para Produção

```bash
# Gerar site estático
docker-compose run --rm mkdocs mkdocs build

# Arquivos gerados em: site/
```

### Verificar Sintaxe

```bash
# Build estrito (falha em warnings)
docker-compose run --rm mkdocs mkdocs build --strict
```

---

## 📁 Estrutura

Ver [docs/README.md](README.md) para estrutura completa.

## ⚙️ Configuração

Ver `mkdocs.yml` na raiz do projeto para configuração completa.

## 📝 Convenções

Ver [PROJECT-CONVENTIONS.md](PROJECT-CONVENTIONS.md) para convenções de documentação.

---

**Última atualização**: 12 de Janeiro de 2026
