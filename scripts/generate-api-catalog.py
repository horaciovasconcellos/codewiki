#!/usr/bin/env python3
"""
Script para gerar catálogo de APIs no MkDocs
Lê payloads da tabela e gera páginas organizadas por aplicação
"""

import mysql.connector
import os
import json
import yaml
from datetime import datetime
from pathlib import Path

# Configuração do banco de dados
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', '3306')),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'rootpass123'),
    'database': os.getenv('MYSQL_DATABASE', 'auditoria_db'),
    'charset': 'utf8mb4'
}

# Diretórios
DOCS_DIR = Path(__file__).parent.parent / 'docs' / 'api-catalog'
OPENAPI_DIR = DOCS_DIR / 'openapi'

def connect_db():
    """Conecta ao banco de dados"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✓ Conectado ao banco de dados {DB_CONFIG['database']}")
        return conn
    except mysql.connector.Error as err:
        print(f"✗ Erro ao conectar ao banco: {err}")
        return None

def get_payloads():
    """Busca todos os payloads com suas aplicações"""
    conn = connect_db()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                p.id,
                p.aplicacao_id,
                p.sigla as payload_sigla,
                p.definicao as descricao_curta,
                p.descricao as descricao_longa,
                p.formato_arquivo,
                p.conteudo_arquivo,
                p.versao_openapi,
                p.arquivo_valido,
                p.data_inicio,
                p.data_termino,
                a.sigla as aplicacao_sigla,
                a.descricao as aplicacao_descricao,
                a.fase_ciclo_vida,
                a.criticidade_negocio
            FROM payloads p
            INNER JOIN aplicacoes a ON p.aplicacao_id = a.id
            WHERE p.arquivo_valido = TRUE
            ORDER BY a.sigla, p.data_inicio DESC
        """
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"✓ Encontrados {len(results)} payloads válidos")
        return results
    except mysql.connector.Error as err:
        print(f"✗ Erro ao buscar payloads: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def format_date(date_obj):
    """Formata data para exibição"""
    if not date_obj:
        return "N/A"
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime("%d/%m/%Y")

def get_status(fase_ciclo_vida, data_termino):
    """Determina o status do serviço"""
    if data_termino:
        return "🔴 Depreciado"
    
    status_map = {
        'Planejamento': '🟡 Em Planejamento',
        'Desenvolvimento': '🟡 Em Desenvolvimento',
        'Testes': '🟠 Em Teste',
        'Homologação': '🟠 Em Homologação',
        'Produção': '🟢 Ativo',
        'Manutenção': '🟢 Ativo',
        'Desativação': '🔴 Desativando',
        'Desativado': '🔴 Desativado'
    }
    
    return status_map.get(fase_ciclo_vida, '⚪ Indefinido')

def ensure_directories():
    """Garante que os diretórios existam"""
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    OPENAPI_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Diretórios criados: {DOCS_DIR}")

def save_openapi_file(payload):
    """Salva o arquivo OpenAPI no diretório apropriado"""
    formato = payload['formato_arquivo'].lower()
    filename = f"{payload['aplicacao_sigla']}_{payload['payload_sigla']}.{formato}"
    filepath = OPENAPI_DIR / filename
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            if formato == 'json':
                # Formatar JSON para melhor legibilidade
                content = json.loads(payload['conteudo_arquivo'])
                json.dump(content, f, indent=2, ensure_ascii=False)
            else:
                # YAML já vem formatado
                f.write(payload['conteudo_arquivo'])
        
        return f"openapi/{filename}"
    except Exception as e:
        print(f"✗ Erro ao salvar arquivo OpenAPI {filename}: {e}")
        return None

def generate_aplicacao_page(aplicacao_sigla, payloads):
    """Gera página markdown para uma aplicação"""
    # Pegar informações da primeira payload (todas são da mesma aplicação)
    first = payloads[0]
    aplicacao_desc = first['aplicacao_descricao']
    criticidade = first['criticidade_negocio']
    
    # Criar conteúdo da página
    content = f"""# {aplicacao_sigla} - Catálogo de APIs

## Aplicação: {aplicacao_sigla}

**Descrição:** {aplicacao_desc}  
**Criticidade:** {criticidade}  
**Total de APIs:** {len(payloads)}

---

## APIs Disponíveis

"""
    
    for payload in payloads:
        status = get_status(payload['fase_ciclo_vida'], payload['data_termino'])
        data_inicio = format_date(payload['data_inicio'])
        data_termino = format_date(payload['data_termino'])
        
        content += f"""### {payload['payload_sigla']}

**Status:** {status}  
**Descrição Curta:** {payload['descricao_curta']}  
"""
        
        if payload['descricao_longa']:
            content += f"""**Descrição Longa:** {payload['descricao_longa']}  
"""
        
        content += f"""**Versão OpenAPI:** {payload['versao_openapi']}  
**Data de Início:** {data_inicio}  
"""
        
        if data_termino != "N/A":
            content += f"""**Data de Término:** {data_termino}  
"""
        
        # Salvar arquivo OpenAPI e gerar referência
        openapi_path = save_openapi_file(payload)
        if openapi_path:
            content += f"""
#### Especificação OpenAPI

```yaml
Arquivo: {openapi_path}
```

!!! tip "Testar API"
    Para testar esta API interativamente, você pode:
    
    1. Baixar o arquivo OpenAPI: [{openapi_path}](/{openapi_path})
    2. Importar no [Swagger Editor](https://editor.swagger.io/)
    3. Ou usar ferramentas como Postman, Insomnia ou curl

"""
        
        content += "---\n\n"
    
    # Salvar página
    filename = f"{aplicacao_sigla.lower()}.md"
    filepath = DOCS_DIR / filename
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Página gerada: {filename}")
        return filename
    except Exception as e:
        print(f"✗ Erro ao gerar página {filename}: {e}")
        return None

def generate_index_page(aplicacoes_map):
    """Gera página índice do catálogo"""
    content = """# Catálogo de APIs - Governança e Testes

## Visão Geral

Este catálogo apresenta todas as APIs documentadas no formato OpenAPI, organizadas por aplicação.

### Governança

Cada API possui:

- ✅ **Status operacional**: Indica se a API está ativa, em desenvolvimento ou depreciada
- 📋 **Metadados**: Nome, sigla, versão, datas de início e término
- 📖 **Documentação**: Descrição curta e longa para contexto completo
- 🔧 **Especificação OpenAPI**: Arquivo JSON/YAML para integração e testes

### Como usar este catálogo

1. Navegue pelas aplicações listadas abaixo
2. Acesse a página de cada aplicação para ver suas APIs
3. Baixe os arquivos OpenAPI para integração
4. Use ferramentas como Swagger Editor ou Postman para testar

---

## Aplicações

"""
    
    total_apis = 0
    for sigla, payloads in sorted(aplicacoes_map.items()):
        count = len(payloads)
        total_apis += count
        desc = payloads[0]['aplicacao_descricao']
        
        content += f"""### [{sigla}]({sigla.lower()}.md)

**Descrição:** {desc}  
**APIs disponíveis:** {count}

"""
    
    content = content.replace("## Aplicações\n\n", f"""## Aplicações

**Total de Aplicações:** {len(aplicacoes_map)}  
**Total de APIs:** {total_apis}

""")
    
    filepath = DOCS_DIR / 'index.md'
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Índice gerado: index.md")
    except Exception as e:
        print(f"✗ Erro ao gerar índice: {e}")

def update_mkdocs_nav():
    """Atualiza mkdocs.yml para incluir catálogo de APIs"""
    mkdocs_file = Path(__file__).parent.parent / 'mkdocs.yml'
    
    try:
        with open(mkdocs_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar se já existe a seção
        if 'Catálogo de APIs' in content:
            print("✓ Seção 'Catálogo de APIs' já existe em mkdocs.yml")
            return
        
        # Adicionar antes da última linha do nav
        nav_section = """
  - "Catálogo de APIs":
      - "Visão Geral": "api-catalog/index.md"
"""
        
        # Encontrar onde inserir (antes de markdown_extensions ou no final do nav)
        if 'markdown_extensions:' in content:
            content = content.replace('markdown_extensions:', nav_section + '\nmarkdown_extensions:')
        else:
            # Inserir no final do arquivo
            content += nav_section
        
        with open(mkdocs_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ mkdocs.yml atualizado com seção 'Catálogo de APIs'")
    except Exception as e:
        print(f"⚠ Aviso: Não foi possível atualizar mkdocs.yml: {e}")
        print("  Adicione manualmente a seção 'Catálogo de APIs' ao nav")

def main():
    """Função principal"""
    print("\n" + "="*60)
    print("Gerador de Catálogo de APIs - Sistema de Auditoria")
    print("="*60 + "\n")
    
    # Criar diretórios
    ensure_directories()
    
    # Buscar payloads
    payloads = get_payloads()
    if not payloads:
        print("\n⚠ Nenhum payload válido encontrado. Encerrando.")
        return
    
    # Agrupar por aplicação
    aplicacoes_map = {}
    for payload in payloads:
        sigla = payload['aplicacao_sigla']
        if sigla not in aplicacoes_map:
            aplicacoes_map[sigla] = []
        aplicacoes_map[sigla].append(payload)
    
    print(f"\n✓ Payloads agrupados em {len(aplicacoes_map)} aplicações\n")
    
    # Gerar páginas
    print("Gerando páginas...\n")
    for sigla, app_payloads in aplicacoes_map.items():
        generate_aplicacao_page(sigla, app_payloads)
    
    # Gerar índice
    print("\nGerando índice...\n")
    generate_index_page(aplicacoes_map)
    
    # Atualizar navegação do mkdocs
    print("\nAtualizando mkdocs.yml...\n")
    update_mkdocs_nav()
    
    print("\n" + "="*60)
    print("✅ Catálogo de APIs gerado com sucesso!")
    print("="*60)
    print(f"\nPáginas geradas em: {DOCS_DIR}")
    print(f"Arquivos OpenAPI em: {OPENAPI_DIR}")
    print("\nPara visualizar:")
    print("  1. docker compose up -d")
    print("  2. Acesse: http://localhost:8000")
    print("\n")

if __name__ == '__main__':
    main()
