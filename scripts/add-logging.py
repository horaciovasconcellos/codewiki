#!/usr/bin/env python3
"""
Script para adicionar logging automático em componentes React/TypeScript
Adiciona useLogging hook e logging nas principais ações
"""

import os
import re
from pathlib import Path

def add_logging_to_component(file_path):
    """Adiciona logging a um componente se ainda não tiver"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se já tem useLogging
    if 'useLogging' in content:
        print(f"✓ {file_path} - já possui logging")
        return False
    
    # Extrair nome do componente do arquivo
    component_name = Path(file_path).stem
    log_name = component_name.replace('View', '-view').replace('Wizard', '-wizard').lower()
    log_name = re.sub(r'([A-Z])', r'-\1', log_name).lower().lstrip('-')
    
    original_content = content
    modified = False
    
    # 1. Adicionar import do useLogging
    import_pattern = r"(import\s+.*?from\s+['\"]react['\"];?\n)"
    if re.search(import_pattern, content):
        content = re.sub(
            import_pattern,
            r"\1import { useLogging } from '@/hooks/use-logging';\n",
            content,
            count=1
        )
        modified = True
        print(f"  + Adicionado import useLogging")
    
    # 2. Adicionar hook no início do componente
    # Procurar função principal do componente
    func_pattern = rf"(export\s+(?:function|const)\s+{component_name}[^{{]*\{{)\n"
    if re.search(func_pattern, content):
        content = re.sub(
            func_pattern,
            rf"\1\n  const {{ logClick, logEvent, logError }} = useLogging('{log_name}');\n",
            content,
            count=1
        )
        modified = True
        print(f"  + Adicionado hook useLogging('{log_name}')")
    
    # 3. Adicionar logging em funções fetch/API
    # Padrão: const response = await fetch(
    fetch_pattern = r"(const\s+\w+\s*=\s*await\s+fetch\([^)]+\))"
    if re.search(fetch_pattern, content):
        # Adicionar logEvent antes do fetch
        content = re.sub(
            r"(\s+)(const\s+\w+\s*=\s*await\s+fetch\()",
            r"\1logEvent('api_call_start', 'api_call');\n\1\2",
            content
        )
        modified = True
        print(f"  + Adicionado logging em chamadas API")
    
    # 4. Adicionar logging em handlers de botão
    # Padrão: onClick={() => { ou onClick={handleXXX}
    content = add_logging_to_handlers(content)
    
    # 5. Adicionar logError em blocos catch
    catch_pattern = r"(catch\s*\([^)]*error[^)]*\)\s*\{\s*\n)"
    if re.search(catch_pattern, content):
        content = re.sub(
            r"(catch\s*\([^)]*error[^)]*\)\s*\{\s*\n\s*)(console\.error)",
            r"\1logError(error as Error, 'error_caught');\n      \2",
            content
        )
        modified = True
        print(f"  + Adicionado logError em blocos catch")
    
    if modified and content != original_content:
        # Salvar arquivo modificado
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {file_path} - logging adicionado com sucesso!\n")
        return True
    else:
        print(f"⚠ {file_path} - não foi possível adicionar logging automaticamente\n")
        return False

def add_logging_to_handlers(content):
    """Adiciona logClick em handlers de eventos"""
    # Padrão simples: onClick={() => setXXX(
    content = re.sub(
        r"(onClick=\{\(\)\s*=>\s*\{)",
        r"\1\n        logClick('button_clicked');",
        content
    )
    return content

def main():
    """Processa todos os componentes no diretório src/components"""
    components_dir = Path(__file__).parent.parent / 'src' / 'components'
    
    if not components_dir.exists():
        print(f"❌ Diretório não encontrado: {components_dir}")
        return
    
    print("🔍 Procurando componentes sem logging...\n")
    
    # Lista de componentes prioritários
    priority_files = [
        'servidores/ServidoresView.tsx',
        'integracoes/IntegracaoView.tsx',
        'capacidades/CapacidadesView.tsx',
        'processos/ProcessosView.tsx',
        'aplicacoes/AplicacoesView.tsx',
        'runbooks/RunbooksView.tsx',
        'tecnologias/TecnologiasView.tsx',
        'slas/SLAsView.tsx',
        'tokens/TokensView.tsx',
        'notificacoes/NotificacoesView.tsx',
        'gerador-projetos/GeradorProjetosView.tsx',
        'azure-work-items/AzureWorkItemsView.tsx',
        'dora/DoraDashboardView.tsx',
        'payloads/PayloadsView.tsx',
        'stages/StagesView.tsx',
        'pipelines/PipelinesView.tsx',
        'carga/CargaDadosView.tsx',
        'carga/CargaLockfilesView.tsx',
        'colaboradores/ColaboradoresView.tsx',
        'adr/ADRsView.tsx',
    ]
    
    modified_count = 0
    skipped_count = 0
    
    for file_rel in priority_files:
        file_path = components_dir / file_rel
        if file_path.exists():
            result = add_logging_to_component(file_path)
            if result:
                modified_count += 1
            else:
                skipped_count += 1
        else:
            print(f"❌ Arquivo não encontrado: {file_path}\n")
    
    print(f"\n📊 Resumo:")
    print(f"  ✓ Modificados: {modified_count}")
    print(f"  ⚠ Já possuíam logging ou não modificados: {skipped_count}")
    print(f"\n✅ Processo concluído!")

if __name__ == '__main__':
    main()
