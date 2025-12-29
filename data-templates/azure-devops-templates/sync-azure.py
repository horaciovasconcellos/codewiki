#!/usr/bin/env python3
"""
Script de Sincronização com Azure DevOps
Autor: Sistema de Auditoria
Data: 2024-03-01
Descrição: Sincroniza work items e sprints do Azure DevOps
"""

import os
import sys
import json
import requests
from datetime import datetime

# Configurações
AZURE_ORG_URL = os.getenv('AZURE_ORG_URL', 'https://dev.azure.com/organization')
AZURE_PAT = os.getenv('AZURE_PAT', '')
AZURE_PROJECT = os.getenv('AZURE_PROJECT', 'MyProject')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')

def get_azure_work_items():
    """Busca work items do Azure DevOps"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {AZURE_PAT}'
    }
    
    url = f"{AZURE_ORG_URL}/{AZURE_PROJECT}/_apis/wit/wiql?api-version=7.0"
    
    query = {
        "query": "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' ORDER BY [System.CreatedDate] DESC"
    }
    
    try:
        response = requests.post(url, headers=headers, json=query)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar work items: {e}")
        return None

def sync_to_local_api(work_items):
    """Sincroniza work items com a API local"""
    headers = {'Content-Type': 'application/json'}
    
    for item in work_items.get('workItems', []):
        work_item_id = item['id']
        
        # Buscar detalhes do work item
        detail_url = f"{AZURE_ORG_URL}/_apis/wit/workitems/{work_item_id}?api-version=7.0"
        
        try:
            response = requests.get(detail_url, headers={'Authorization': f'Basic {AZURE_PAT}'})
            response.raise_for_status()
            details = response.json()
            
            # Enviar para API local
            api_url = f"{API_BASE_URL}/azure-work-items"
            local_response = requests.post(api_url, headers=headers, json=details)
            local_response.raise_for_status()
            
            print(f"✓ Work Item {work_item_id} sincronizado com sucesso")
        except requests.exceptions.RequestException as e:
            print(f"✗ Erro ao sincronizar work item {work_item_id}: {e}")

def main():
    """Função principal"""
    print("=== Sincronização com Azure DevOps ===")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    if not AZURE_PAT:
        print("ERRO: Azure PAT não configurado!")
        sys.exit(1)
    
    print("Buscando work items do Azure DevOps...")
    work_items = get_azure_work_items()
    
    if work_items:
        print(f"Encontrados {len(work_items.get('workItems', []))} work items")
        print()
        print("Sincronizando com a API local...")
        sync_to_local_api(work_items)
        print()
        print("Sincronização concluída!")
    else:
        print("Nenhum work item encontrado ou erro na busca")
        sys.exit(1)

if __name__ == "__main__":
    main()
