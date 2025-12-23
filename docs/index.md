# Sistema de Auditoria 📊

Bem-vindo à documentação completa do Sistema de Auditoria - uma solução completa para gestão de aplicações, integrações e infraestrutura tecnológica.

## 🚀 Início Rápido

Comece rapidamente com nosso sistema:

- **[Quick Start](QUICKSTART.md)** - Configure e execute em minutos
- **[Manual de Instalação](MANUAL_INSTALACAO.md)** - Guia completo de instalação
- **[Guia de Deployment](DEPLOYMENT_GUIDE.md)** - Deploy em produção

## ✨ Funcionalidades Principais

### Gestão de Aplicações
- Cadastro completo de aplicações
- Relacionamentos com tecnologias
- Ambientes tecnológicos
- Capacidades de negócio

### Sistema de Integrações
- **User-to-Cloud** - Integração de usuários para cloud
- **User-to-OnPremise** - Integração de usuários para on-premise
- **Cloud-to-Cloud** - Integração entre clouds
- **OnPremise-to-Cloud** - Integração on-premise para cloud
- **OnPremise-to-OnPremise** - Integração entre ambientes on-premise

### Sistema de Logging
- Traces distribuídos W3C
- Logs de auditoria persistentes
- APIs de consulta e estatísticas
- Interface de análise de logs

### Dashboard e Métricas
- Visualizações em tempo real
- Métricas de aplicações
- Status de integrações
- Indicadores de performance

## 📚 Documentação por Seção

### Para Começar
- [Primeiros Passos](primeiros-passos.md)
- [Configuração](CONFIGURACAO_BD.md)
- [Docker Setup](DOCKER_SETUP.md)

### Desenvolvimento
- [Estrutura de Aplicações](ESTRUTURA_APLICACOES.md)
- [APIs](DOCUMENTACAO_API.md)
- [Desenvolvimento](desenvolvimento.md)

### Produção
- [Production Deploy](PRODUCTION_DEPLOY.md)
- [Segurança](SECURITY.md)
- [Troubleshooting](TROUBLESHOOTING_RUNBOOK.md)

## 🛠️ Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Banco de Dados:** MySQL 8.0 (Master-Slave)
- **Deploy:** Docker + Docker Compose
- **Documentação:** MkDocs Material

## 📦 Release Atual

**Versão:** 1.0.0  
**Data:** 14 de Dezembro de 2025  
**Status:** ✅ Pronto para Produção

Veja as [Release Notes](RELEASE_NOTES.md) para detalhes completos.

## 🔧 Comandos Úteis

### Docker
```bash
# Iniciar sistema
./docker-manager.sh start

# Ver logs
docker logs auditoria-app -f

# Parar sistema
./docker-manager.sh stop
```

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Build para produção
./build-production.sh
```

### Documentação
```bash
# Servir documentação localmente
mkdocs serve

# Build da documentação
mkdocs build

# Deploy para GitHub Pages
mkdocs gh-deploy
```

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/horaciovasconcellos/sistema-de-auditoria/issues)
- **Email:** horacio.vasconcellos@gmail.com
- **Documentação:** Navegue pelo menu lateral ←

## 📄 Navegação Rápida

Use o menu lateral para explorar toda a documentação organizada por categorias:

- 🏠 **Início** - Você está aqui
- 🚀 **Primeiros Passos** - Configure o sistema
- 🐳 **Docker** - Containerização
- ⚙️ **Configuração** - Setup e ajustes
- 💻 **Desenvolvimento** - Guias de desenvolvimento
- 🔌 **API** - Documentação de APIs
- ✨ **Funcionalidades** - Recursos do sistema
- 🗄️ **Banco de Dados** - Gestão de dados
- ☁️ **Azure DevOps** - Integração Azure
- 🏭 **Produção** - Deploy e manutenção
- 🧪 **Testes e Debug** - Troubleshooting
- 📖 **Documentação** - Meta-documentação
- 📦 **Release** - Versões e changelog
- 🔐 **Segurança** - Segurança da informação

---

**🎉 Sistema pronto para uso em produção!**

Explore a documentação e comece a usar o Sistema de Auditoria hoje mesmo.

