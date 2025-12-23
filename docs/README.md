# Sistema de Auditoria 📊

Sistema completo de auditoria e gestão de aplicações, integrações e infraestrutura tecnológica.

## 🚀 Quick Start

```bash
# Clone o repositório
git clone https://github.com/horaciovasconcellos/sistema-de-auditoria.git
cd sistema-de-auditoria

# Configure o ambiente
cp .env.example .env

# Inicie com Docker
./docker-manager.sh start

# Acesse
http://localhost:3000
```

## 📚 Documentação

A documentação completa está disponível em:
- **Online:** [Documentação MkDocs](http://localhost:8000) (após rodar `mkdocs serve`)
- **Diretório docs/:** Todos os arquivos markdown de documentação

### Documentos Principais

- 📖 [README Completo](docs/README.md) - Visão geral detalhada
- 🚀 [Quick Start](docs/QUICKSTART.md) - Início rápido
- 🏗️ [Guia de Deployment](docs/DEPLOYMENT_GUIDE.md) - Deploy em produção
- 🐳 [Docker Guide](docs/DOCKER_GUIDE.md) - Configuração Docker
- 📝 [Changelog](docs/CHANGELOG.md) - Histórico de versões
- 🔒 [Security](docs/SECURITY.md) - Segurança

## ✨ Funcionalidades

- ✅ **Gestão de Aplicações** - Cadastro e controle de aplicações
- ✅ **Gestão de Integrações** - 5 tipos de integrações suportadas
- ✅ **Sistema de Logging** - Traces distribuídos W3C
- ✅ **Dashboard** - Métricas e visualizações
- ✅ **APIs REST** - Interface completa de APIs
- ✅ **Auditoria** - Logs persistentes e consultas

## 🛠️ Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Banco de Dados:** MySQL 8.0 (Master-Slave)
- **Deploy:** Docker + Docker Compose
- **Documentação:** MkDocs Material

## 📋 Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (apenas para desenvolvimento)
- 4GB RAM mínimo

## 📦 Release Atual

**Versão:** 1.0.0  
**Data:** 14 de Dezembro de 2025  
**Status:** ✅ Pronto para Produção

Veja [Release Notes](docs/RELEASE_NOTES.md) para detalhes.

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Build para produção
./build-production.sh

# Testes
npm test
```

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/horaciovasconcellos/sistema-de-auditoria/issues)
- **Email:** horacio.vasconcellos@gmail.com
- **Documentação:** Veja o diretório `docs/`

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](docs/LICENSE.md) para mais detalhes.

## 👥 Autor

**Horacio Vasconcellos**
- GitHub: [@horaciovasconcellos](https://github.com/horaciovasconcellos)
- LinkedIn: [Horácio Vasconcellos](https://www.linkedin.com/in/horácio-vasconcellos)

---

**🎉 Sistema pronto para uso em produção!**

Para mais informações, consulte a [documentação completa](docs/).
