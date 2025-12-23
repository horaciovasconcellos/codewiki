# 🚀 Quick Start - API Bulk Load

## Execute em 3 Passos

### 1️⃣ Verifique o servidor
```bash
docker-compose ps
```

### 2️⃣ Execute o teste
```bash
./test-bulk-load.sh
```

### 3️⃣ Verifique os resultados
```bash
docker exec -it sistema-auditoria-mysql mysql -u app_user -papppass123 auditoria_db -e "SELECT sigla, descricao FROM aplicacoes;"
```

## 📖 Documentação Completa

- **API Completa**: `docs/API-Bulk-Load-Aplicacoes.md`
- **Guia de Exemplos**: `examples/README.md`
- **Detalhes Técnicos**: `BULK-LOAD-IMPLEMENTATION.md`
- **Resumo**: `IMPLEMENTACAO-RESUMO.md`

## 🎯 Endpoint

```
POST http://localhost:3000/api/aplicacoes/bulk
Content-Type: application/json
```

## 📝 JSON Mínimo

```json
{
  "aplicacoes": [
    {
      "sigla": "APP-001",
      "descricao": "Minha Aplicação",
      "url_documentacao": "https://docs.example.com",
      "fase_ciclo_vida": "Produção",
      "criticidade_negocio": "Alta"
    }
  ]
}
```

## ⚠️ Importante

Cadastre ANTES de executar:
- Tecnologias (tech-XXX)
- Capacidades (cap-XXX)
- Processos (proc-XXX)
- SLAs (sla-XXX)

Veja `examples/README.md` para scripts.
