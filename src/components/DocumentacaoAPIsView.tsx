import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Code, Copy, BookOpen } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface DocumentacaoAPIsViewProps {}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: string;
  response?: string;
}

const apiEndpoints: Record<string, ApiEndpoint[]> = {
  'tipos-afastamento': [
    {
      method: 'GET',
      path: '/api/tipos-afastamento',
      description: 'Listar todos os tipos de afastamento',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "descricao": "string",
    "argumentacaoLegal": "string",
    "numeroDias": 0,
    "tipoTempo": "C" | "N"
  }
]`
    },
    {
      method: 'GET',
      path: '/api/tipos-afastamento/{id}',
      description: 'Consultar um tipo de afastamento específico',
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "argumentacaoLegal": "string",
  "numeroDias": 0,
  "tipoTempo": "C" | "N"
}`
    },
    {
      method: 'POST',
      path: '/api/tipos-afastamento',
      description: 'Criar um novo tipo de afastamento',
      requestBody: `{
  "sigla": "string",
  "descricao": "string",
  "argumentacaoLegal": "string",
  "numeroDias": 0,
  "tipoTempo": "C" | "N"
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "argumentacaoLegal": "string",
  "numeroDias": 0,
  "tipoTempo": "C" | "N"
}`
    },
    {
      method: 'PUT',
      path: '/api/tipos-afastamento/{id}',
      description: 'Atualizar um tipo de afastamento existente',
      requestBody: `{
  "sigla": "string",
  "descricao": "string",
  "argumentacaoLegal": "string",
  "numeroDias": 0,
  "tipoTempo": "C" | "N"
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "argumentacaoLegal": "string",
  "numeroDias": 0,
  "tipoTempo": "C" | "N"
}`
    }
  ],
  'capacidades-negocio': [
    {
      method: 'GET',
      path: '/api/capacidades-negocio',
      description: 'Listar todas as capacidades de negócio',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "nome": "string",
    "descricao": "string",
    "nivel": "Nível 1" | "Nível 2" | "Nível 3",
    "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "string",
      "beneficiosEsperados": "string",
      "estadoFuturoDesejado": "string",
      "gapEstadoAtualFuturo": "string"
    }
  }
]`
    },
    {
      method: 'GET',
      path: '/api/capacidades-negocio/{id}',
      description: 'Consultar uma capacidade de negócio específica',
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "descricao": "string",
  "nivel": "Nível 1" | "Nível 2" | "Nível 3",
  "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "string",
    "beneficiosEsperados": "string",
    "estadoFuturoDesejado": "string",
    "gapEstadoAtualFuturo": "string"
  }
}`
    },
    {
      method: 'POST',
      path: '/api/capacidades-negocio',
      description: 'Criar uma nova capacidade de negócio',
      requestBody: `{
  "sigla": "string",
  "nome": "string",
  "descricao": "string",
  "nivel": "Nível 1" | "Nível 2" | "Nível 3",
  "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "string",
    "beneficiosEsperados": "string",
    "estadoFuturoDesejado": "string",
    "gapEstadoAtualFuturo": "string"
  }
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "descricao": "string",
  "nivel": "Nível 1" | "Nível 2" | "Nível 3",
  "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "string",
    "beneficiosEsperados": "string",
    "estadoFuturoDesejado": "string",
    "gapEstadoAtualFuturo": "string"
  }
}`
    },
    {
      method: 'PUT',
      path: '/api/capacidades-negocio/{id}',
      description: 'Atualizar uma capacidade de negócio existente',
      requestBody: `{
  "sigla": "string",
  "nome": "string",
  "descricao": "string",
  "nivel": "Nível 1" | "Nível 2" | "Nível 3",
  "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "string",
    "beneficiosEsperados": "string",
    "estadoFuturoDesejado": "string",
    "gapEstadoAtualFuturo": "string"
  }
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "descricao": "string",
  "nivel": "Nível 1" | "Nível 2" | "Nível 3",
  "categoria": "Financeiro" | "RH" | "Logística" | "Atendimento" | "Produção" | "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "string",
    "beneficiosEsperados": "string",
    "estadoFuturoDesejado": "string",
    "gapEstadoAtualFuturo": "string"
  }
}`
    }
  ],
  'colaboradores': [
    {
      method: 'GET',
      path: '/api/colaboradores',
      description: 'Listar todos os colaboradores',
      response: `[
  {
    "id": "string",
    "matricula": "string",
    "nome": "string",
    "setor": "string",
    "dataAdmissao": "YYYY-MM-DD",
    "dataDemissao": "YYYY-MM-DD",
    "afastamentos": []
  }
]`
    },
    {
      method: 'GET',
      path: '/api/colaboradores/{id}',
      description: 'Consultar um colaborador específico',
      response: `{
  "id": "string",
  "matricula": "string",
  "nome": "string",
  "setor": "string",
  "dataAdmissao": "YYYY-MM-DD",
  "dataDemissao": "YYYY-MM-DD",
  "afastamentos": []
}`
    },
    {
      method: 'POST',
      path: '/api/colaboradores',
      description: 'Criar um novo colaborador',
      requestBody: `{
  "matricula": "string",
  "nome": "string",
  "setor": "string",
  "dataAdmissao": "YYYY-MM-DD",
  "dataDemissao": "YYYY-MM-DD",
  "afastamentos": []
}`,
      response: `{
  "id": "string",
  "matricula": "string",
  "nome": "string",
  "setor": "string",
  "dataAdmissao": "YYYY-MM-DD",
  "dataDemissao": "YYYY-MM-DD",
  "afastamentos": []
}`
    },
    {
      method: 'PUT',
      path: '/api/colaboradores/{id}',
      description: 'Atualizar um colaborador existente',
      requestBody: `{
  "matricula": "string",
  "nome": "string",
  "setor": "string",
  "dataAdmissao": "YYYY-MM-DD",
  "dataDemissao": "YYYY-MM-DD",
  "afastamentos": []
}`,
      response: `{
  "id": "string",
  "matricula": "string",
  "nome": "string",
  "setor": "string",
  "dataAdmissao": "YYYY-MM-DD",
  "dataDemissao": "YYYY-MM-DD",
  "afastamentos": []
}`
    }
  ],
  'slas': [
    {
      method: 'GET',
      path: '/api/slas',
      description: 'Listar todos os SLAs',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "descricao": "string",
    "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
    "dataInicio": "YYYY-MM-DD",
    "dataTermino": "YYYY-MM-DD",
    "status": "Ativo" | "Inativo"
  }
]`
    },
    {
      method: 'GET',
      path: '/api/slas/{id}',
      description: 'Consultar um SLA específico',
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
  "dataInicio": "YYYY-MM-DD",
  "dataTermino": "YYYY-MM-DD",
  "status": "Ativo" | "Inativo"
}`
    },
    {
      method: 'POST',
      path: '/api/slas',
      description: 'Criar um novo SLA',
      requestBody: `{
  "sigla": "string",
  "descricao": "string",
  "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
  "dataInicio": "YYYY-MM-DD",
  "dataTermino": "YYYY-MM-DD",
  "status": "Ativo" | "Inativo"
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
  "dataInicio": "YYYY-MM-DD",
  "dataTermino": "YYYY-MM-DD",
  "status": "Ativo" | "Inativo"
}`
    },
    {
      method: 'PUT',
      path: '/api/slas/{id}',
      description: 'Atualizar um SLA existente',
      requestBody: `{
  "sigla": "string",
  "descricao": "string",
  "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
  "dataInicio": "YYYY-MM-DD",
  "dataTermino": "YYYY-MM-DD",
  "status": "Ativo" | "Inativo"
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricao": "string",
  "tipoSLA": "SLA por Serviço" | "SLA por Cliente" | ...,
  "dataInicio": "YYYY-MM-DD",
  "dataTermino": "YYYY-MM-DD",
  "status": "Ativo" | "Inativo"
}`
    }
  ],
  'processos-negocio': [
    {
      method: 'GET',
      path: '/api/processos-negocio',
      description: 'Listar todos os processos de negócio',
      response: `[
  {
    "id": "string",
    "identificacao": "string",
    "descricao": "string",
    "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
    "areaResponsavel": "string",
    "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
    "duracaoMedia": 0,
    "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
    "normas": []
  }
]`
    },
    {
      method: 'GET',
      path: '/api/processos-negocio/{id}',
      description: 'Consultar um processo de negócio específico',
      response: `{
  "id": "string",
  "identificacao": "string",
  "descricao": "string",
  "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
  "areaResponsavel": "string",
  "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
  "duracaoMedia": 0,
  "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
  "normas": []
}`
    },
    {
      method: 'POST',
      path: '/api/processos-negocio',
      description: 'Criar um novo processo de negócio',
      requestBody: `{
  "identificacao": "string",
  "descricao": "string",
  "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
  "areaResponsavel": "string",
  "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
  "duracaoMedia": 0,
  "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
  "normas": []
}`,
      response: `{
  "id": "string",
  "identificacao": "string",
  "descricao": "string",
  "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
  "areaResponsavel": "string",
  "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
  "duracaoMedia": 0,
  "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
  "normas": []
}`
    },
    {
      method: 'PUT',
      path: '/api/processos-negocio/{id}',
      description: 'Atualizar um processo de negócio existente',
      requestBody: `{
  "identificacao": "string",
  "descricao": "string",
  "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
  "areaResponsavel": "string",
  "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
  "duracaoMedia": 0,
  "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
  "normas": []
}`,
      response: `{
  "id": "string",
  "identificacao": "string",
  "descricao": "string",
  "nivelMaturidade": "Inicial" | "Repetível" | "Definido" | "Gerenciado" | "Otimizado",
  "areaResponsavel": "string",
  "frequencia": "Diário" | "Semanal" | "Mensal" | ...,
  "duracaoMedia": 0,
  "complexidade": "Muito Baixa" | "Baixa" | "Média" | "Alta" | "Muito Alta",
  "normas": []
}`
    }
  ],
  'tecnologias': [
    {
      method: 'GET',
      path: '/api/tecnologias',
      description: 'Listar todas as tecnologias',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "nome": "string",
    "versaoRelease": "string",
    "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
    "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
    "fornecedorFabricante": "string",
    "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
    "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
    "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
  }
]`
    },
    {
      method: 'GET',
      path: '/api/tecnologias/{id}',
      description: 'Consultar uma tecnologia específica',
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "versaoRelease": "string",
  "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
  "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
  "fornecedorFabricante": "string",
  "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
  "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
  "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
}`
    },
    {
      method: 'POST',
      path: '/api/tecnologias',
      description: 'Criar uma nova tecnologia',
      requestBody: `{
  "sigla": "string",
  "nome": "string",
  "versaoRelease": "string",
  "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
  "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
  "fornecedorFabricante": "string",
  "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
  "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
  "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "versaoRelease": "string",
  "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
  "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
  "fornecedorFabricante": "string",
  "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
  "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
  "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
}`
    },
    {
      method: 'PUT',
      path: '/api/tecnologias/{id}',
      description: 'Atualizar uma tecnologia existente',
      requestBody: `{
  "sigla": "string",
  "nome": "string",
  "versaoRelease": "string",
  "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
  "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
  "fornecedorFabricante": "string",
  "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
  "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
  "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "versaoRelease": "string",
  "categoria": "Aplicação Terceira" | "Banco de Dados" | ...,
  "status": "Ativa" | "Em avaliação" | "Obsoleta" | "Descontinuada",
  "fornecedorFabricante": "string",
  "tipoLicenciamento": "Open Source" | "Proprietária" | "SaaS" | "Subscription",
  "maturidadeInterna": "Experimental" | "Adotada" | "Padronizada" | "Restrita",
  "nivelSuporteInterno": "Sem Suporte Interno" | "Suporte Básico" | ...
}`
    }
  ],
  'runbooks': [
    {
      method: 'GET',
      path: '/api/runbooks',
      description: 'Listar todos os runbooks',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "descricaoResumida": "string",
    "finalidade": "string",
    "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
  }
]`
    },
    {
      method: 'GET',
      path: '/api/runbooks/{id}',
      description: 'Consultar um runbook específico',
      response: `{
  "id": "string",
  "sigla": "string",
  "descricaoResumida": "string",
  "finalidade": "string",
  "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
}`
    },
    {
      method: 'POST',
      path: '/api/runbooks',
      description: 'Criar um novo runbook',
      requestBody: `{
  "sigla": "string",
  "descricaoResumida": "string",
  "finalidade": "string",
  "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricaoResumida": "string",
  "finalidade": "string",
  "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
}`
    },
    {
      method: 'PUT',
      path: '/api/runbooks/{id}',
      description: 'Atualizar um runbook existente',
      requestBody: `{
  "sigla": "string",
  "descricaoResumida": "string",
  "finalidade": "string",
  "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
}`,
      response: `{
  "id": "string",
  "sigla": "string",
  "descricaoResumida": "string",
  "finalidade": "string",
  "tipoRunbook": "Procedimento de Rotina" | "Contingência" | ...
}`
    }
  ],
  'integracoes': [
    {
      method: 'GET',
      path: '/api/integracoes',
      description: 'Listar todas as integrações',
      response: `[
  {
    "id": "string",
    "sigla": "string",
    "nome": "string",
    "payload": "string (JSON)",
    "especificacao_filename": "string | null",
    "especificacao_mimetype": "string | null",
    "created_at": "string (timestamp)",
    "updated_at": "string (timestamp)"
  }
]`
    },
    {
      method: 'GET',
      path: '/api/integracoes/{id}',
      description: 'Consultar uma integração específica por ID (sem arquivo)',
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "payload": "string (JSON)",
  "especificacao_filename": "string | null",
  "especificacao_mimetype": "string | null",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'GET',
      path: '/api/integracoes/{id}/especificacao',
      description: 'Download do arquivo de especificação (PDF/DOCX)',
      response: `Binary data (arquivo PDF ou DOCX)
Headers:
  Content-Type: application/pdf | application/vnd.openxmlformats-officedocument.wordprocessingml.document
  Content-Disposition: attachment; filename="nome_do_arquivo.pdf"`
    },
    {
      method: 'POST',
      path: '/api/integracoes',
      description: 'Criar uma nova integração (com upload de arquivo)',
      requestBody: `FormData com os campos:
  sigla: "string"
  nome: "string"
  payload: "string (JSON válido)"
  especificacao: File (opcional, PDF ou DOCX, máx 10MB)
  
Exemplo usando fetch:
const formData = new FormData();
formData.append('sigla', 'INT-001');
formData.append('nome', 'Integração Azure');
formData.append('payload', '{"key": "value"}');
formData.append('especificacao', fileInput.files[0]);

fetch('/api/integracoes', {
  method: 'POST',
  body: formData
});`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "payload": "string (JSON)",
  "especificacao_filename": "string | null",
  "especificacao_mimetype": "string | null",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'PUT',
      path: '/api/integracoes/{id}',
      description: 'Atualizar uma integração existente (com upload de arquivo)',
      requestBody: `FormData com os campos:
  sigla: "string"
  nome: "string"
  payload: "string (JSON válido)"
  especificacao: File (opcional, PDF ou DOCX, máx 10MB)
  
Obs: Se um novo arquivo for enviado, substitui o anterior`,
      response: `{
  "id": "string",
  "sigla": "string",
  "nome": "string",
  "payload": "string (JSON)",
  "especificacao_filename": "string | null",
  "especificacao_mimetype": "string | null",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'DELETE',
      path: '/api/integracoes/{id}',
      description: 'Excluir uma integração (e todas as execuções relacionadas)',
      response: `{
  "message": "Integração excluída com sucesso"
}`
    }
  ],
  'integracoes-execucoes': [
    {
      method: 'GET',
      path: '/api/integracoes-execucoes',
      description: 'Listar todas as execuções de integrações',
      response: `[
  {
    "id": "string",
    "integracao_id": "string",
    "aplicacao_origem": "string",
    "aplicacao_destino": "string",
    "data_inicio": "string (YYYY-MM-DD)",
    "data_termino": "string | null (YYYY-MM-DD)",
    "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída",
    "created_at": "string (timestamp)",
    "updated_at": "string (timestamp)"
  }
]`
    },
    {
      method: 'GET',
      path: '/api/integracoes-execucoes/{id}',
      description: 'Consultar uma execução específica por ID',
      response: `{
  "id": "string",
  "integracao_id": "string",
  "aplicacao_origem": "string",
  "aplicacao_destino": "string",
  "data_inicio": "string (YYYY-MM-DD)",
  "data_termino": "string | null (YYYY-MM-DD)",
  "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'POST',
      path: '/api/integracoes-execucoes',
      description: 'Criar uma nova execução de integração',
      requestBody: `{
  "integracao_id": "string",
  "aplicacao_origem": "string",
  "aplicacao_destino": "string",
  "data_inicio": "string (YYYY-MM-DD)",
  "data_termino": "string | null (YYYY-MM-DD)",
  "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída"
}`,
      response: `{
  "id": "string",
  "integracao_id": "string",
  "aplicacao_origem": "string",
  "aplicacao_destino": "string",
  "data_inicio": "string (YYYY-MM-DD)",
  "data_termino": "string | null (YYYY-MM-DD)",
  "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'PUT',
      path: '/api/integracoes-execucoes/{id}',
      description: 'Atualizar uma execução existente',
      requestBody: `{
  "aplicacao_origem": "string",
  "aplicacao_destino": "string",
  "data_inicio": "string (YYYY-MM-DD)",
  "data_termino": "string | null (YYYY-MM-DD)",
  "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída"
}`,
      response: `{
  "id": "string",
  "integracao_id": "string",
  "aplicacao_origem": "string",
  "aplicacao_destino": "string",
  "data_inicio": "string (YYYY-MM-DD)",
  "data_termino": "string | null (YYYY-MM-DD)",
  "status": "Ativa" | "Inativa" | "Em Processamento" | "Erro" | "Concluída",
  "created_at": "string (timestamp)",
  "updated_at": "string (timestamp)"
}`
    },
    {
      method: 'DELETE',
      path: '/api/integracoes-execucoes/{id}',
      description: 'Excluir uma execução',
      response: `{
  "message": "Execução excluída com sucesso"
}`
    }
  ],
  'servidores': [
    {
      method: 'GET',
      path: '/api/servidores',
      description: 'Listar todos os servidores',
      response: `[
  {
    "id": "string (UUID)",
    "sigla": "string",
    "hostname": "string",
    "tipo": "Físico" | "Virtual" | "Cloud",
    "ambiente": "Desenvolvimento" | "Homologação" | "Produção" | "Teste",
    "finalidade": "Aplicação" | "Banco de Dados" | "Proxy" | "Load Balancer" | ...,
    "status": "Ativo" | "Inativo" | "Manutenção" | "Descomissionado",
    "provedor": "On-Premise" | "AWS" | "Azure" | "GCP" | "Oracle Cloud",
    "datacenterRegiao": "string | null",
    "sistemaOperacional": "Ubuntu" | "CentOS" | "Windows Server" | ...,
    "ferramentaMonitoramento": "Zabbix" | "Prometheus" | "Nagios" | ...,
    "backupDiario": boolean,
    "backupSemanal": boolean,
    "backupMensal": boolean
  }
]`
    },
    {
      method: 'GET',
      path: '/api/servidores/{id}',
      description: 'Consultar um servidor específico',
      response: `{
  "id": "string (UUID)",
  "sigla": "string",
  "hostname": "string",
  "tipo": "Físico" | "Virtual" | "Cloud",
  "ambiente": "Desenvolvimento" | "Homologação" | "Produção" | "Teste",
  "finalidade": "Aplicação" | "Banco de Dados" | "Proxy" | "Load Balancer" | ...,
  "status": "Ativo" | "Inativo" | "Manutenção" | "Descomissionado",
  "provedor": "On-Premise" | "AWS" | "Azure" | "GCP" | "Oracle Cloud",
  "datacenterRegiao": "string | null",
  "zonaAvailability": "string | null",
  "clusterHost": "string | null",
  "virtualizador": "VMware" | "Hyper-V" | "KVM" | ...,
  "sistemaOperacional": "Ubuntu" | "CentOS" | "Windows Server" | ...,
  "distribuicaoVersao": "string | null",
  "arquitetura": "string | null",
  "ferramentaMonitoramento": "Zabbix" | "Prometheus" | "Nagios" | ...,
  "backupDiario": boolean,
  "backupSemanal": boolean,
  "backupMensal": boolean,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}`
    },
    {
      method: 'POST',
      path: '/api/servidores',
      description: 'Criar um novo servidor',
      requestBody: `{
  "sigla": "string (obrigatório)",
  "hostname": "string (obrigatório)",
  "tipo": "Físico" | "Virtual" | "Cloud" (obrigatório),
  "ambiente": "Desenvolvimento" | "Homologação" | "Produção" | "Teste" (obrigatório),
  "finalidade": "string (obrigatório)",
  "status": "Ativo" (padrão),
  "provedor": "string (obrigatório)",
  "datacenterRegiao": "string | null",
  "zonaAvailability": "string | null",
  "clusterHost": "string | null",
  "virtualizador": "string | null",
  "sistemaOperacional": "string (obrigatório)",
  "distribuicaoVersao": "string | null",
  "arquitetura": "string | null",
  "ferramentaMonitoramento": "string | null",
  "backupDiario": boolean (padrão: false),
  "backupSemanal": boolean (padrão: false),
  "backupMensal": boolean (padrão: false)
}`,
      response: `{
  "id": "string (UUID gerado)",
  "sigla": "string",
  "hostname": "string",
  "tipo": "string",
  "ambiente": "string",
  "finalidade": "string",
  "status": "string",
  "provedor": "string",
  "datacenterRegiao": "string | null",
  "zonaAvailability": "string | null",
  "clusterHost": "string | null",
  "virtualizador": "string | null",
  "sistemaOperacional": "string",
  "distribuicaoVersao": "string | null",
  "arquitetura": "string | null",
  "ferramentaMonitoramento": "string | null",
  "backupDiario": boolean,
  "backupSemanal": boolean,
  "backupMensal": boolean,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}`
    },
    {
      method: 'PUT',
      path: '/api/servidores/{id}',
      description: 'Atualizar um servidor existente',
      requestBody: `{
  "sigla": "string",
  "hostname": "string",
  "tipo": "Físico" | "Virtual" | "Cloud",
  "ambiente": "Desenvolvimento" | "Homologação" | "Produção" | "Teste",
  "finalidade": "string",
  "status": "Ativo" | "Inativo" | "Manutenção" | "Descomissionado",
  "provedor": "string",
  "datacenterRegiao": "string | null",
  "zonaAvailability": "string | null",
  "clusterHost": "string | null",
  "virtualizador": "string | null",
  "sistemaOperacional": "string",
  "distribuicaoVersao": "string | null",
  "arquitetura": "string | null",
  "ferramentaMonitoramento": "string | null",
  "backupDiario": boolean,
  "backupSemanal": boolean,
  "backupMensal": boolean
}`,
      response: `{
  "id": "string (UUID)",
  "sigla": "string",
  "hostname": "string",
  "tipo": "string",
  "ambiente": "string",
  "finalidade": "string",
  "status": "string",
  "provedor": "string",
  "datacenterRegiao": "string | null",
  "zonaAvailability": "string | null",
  "clusterHost": "string | null",
  "virtualizador": "string | null",
  "sistemaOperacional": "string",
  "distribuicaoVersao": "string | null",
  "arquitetura": "string | null",
  "ferramentaMonitoramento": "string | null",
  "backupDiario": boolean,
  "backupSemanal": boolean,
  "backupMensal": boolean,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}`
    },
    {
      method: 'DELETE',
      path: '/api/servidores/{id}',
      description: 'Excluir um servidor',
      response: `{
  "message": "Servidor excluído com sucesso"
}`
    },
    {
      method: 'GET',
      path: '/api/servidores/{servidorId}/aplicacoes',
      description: 'Listar aplicações de um servidor',
      response: `[
  {
    "id": "string",
    "servidorId": "string (UUID)",
    "aplicacaoId": "string (UUID)",
    "siglaAplicacao": "string",
    "nomeAplicacao": "string",
    "porta": number,
    "caminho": "string",
    "usuario": "string",
    "serviceName": "string",
    "startCommand": "string",
    "stopCommand": "string",
    "observacoes": "string",
    "created_at": "timestamp"
  }
]`
    },
    {
      method: 'POST',
      path: '/api/servidores/{servidorId}/aplicacoes',
      description: 'Adicionar aplicação a um servidor',
      requestBody: `{
  "aplicacaoId": "string (UUID, obrigatório)",
  "porta": number,
  "caminho": "string",
  "usuario": "string",
  "serviceName": "string",
  "startCommand": "string",
  "stopCommand": "string",
  "observacoes": "string"
}`,
      response: `{
  "id": "string (UUID gerado)",
  "servidorId": "string (UUID)",
  "aplicacaoId": "string (UUID)",
  "porta": number,
  "caminho": "string",
  "usuario": "string",
  "serviceName": "string",
  "startCommand": "string",
  "stopCommand": "string",
  "observacoes": "string",
  "created_at": "timestamp"
}`
    },
    {
      method: 'DELETE',
      path: '/api/servidores/{servidorId}/aplicacoes',
      description: 'Remover todas as aplicações de um servidor',
      response: `{
  "message": "Aplicações removidas com sucesso"
}`
    },
    {
      method: 'DELETE',
      path: '/api/servidores/{servidorId}/aplicacoes/{id}',
      description: 'Remover uma aplicação específica do servidor',
      response: `{
  "message": "Aplicação removida com sucesso"
}`
    }
  ]
};

export function DocumentacaoAPIsView({}: DocumentacaoAPIsViewProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('tipos-afastamento');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Documentação de APIs</h1>
              <p className="text-muted-foreground mt-2">
                Referência completa para consulta, criação e atualização de dados via API REST
              </p>
            </div>
            <Button 
              onClick={() => window.open('http://localhost:8000', '_blank')}
              variant="outline"
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Documentação Completa (MKDocs)
            </Button>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code />
                Endpoints Disponíveis
              </CardTitle>
              <CardDescription>
                Documentação dos endpoints REST para integração com o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
                  <TabsTrigger value="tipos-afastamento">Afastamentos</TabsTrigger>
                  <TabsTrigger value="capacidades-negocio">Capacidades</TabsTrigger>
                  <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
                  <TabsTrigger value="slas">SLAs</TabsTrigger>
                  <TabsTrigger value="processos-negocio">Processos</TabsTrigger>
                  <TabsTrigger value="tecnologias">Tecnologias</TabsTrigger>
                  <TabsTrigger value="servidores">Servidores</TabsTrigger>
                  <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
                  <TabsTrigger value="integracoes">Integrações</TabsTrigger>
                  <TabsTrigger value="integracoes-execucoes">Execuções</TabsTrigger>
                  <TabsTrigger value="scripts-carga">Scripts</TabsTrigger>
                </TabsList>

                <TabsContent value="scripts-carga" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scripts de Carga de Dados</CardTitle>
                      <CardDescription>
                        Processos automatizados para carga de dados via Shell e Python
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Scripts Shell (.sh)</h3>
                        <p className="text-sm text-muted-foreground">
                          Scripts Bash para carga em lote de dados via API REST. Localização: <code className="text-xs bg-muted px-1 py-0.5 rounded">scripts/</code>
                        </p>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-tipos-afastamento.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega tipos de afastamento do arquivo CSV</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-tipos-afastamento.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/tipos-afastamento.csv</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-habilidades.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega habilidades técnicas do JSON</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-habilidades.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/habilidades.json</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-capacidades-negocio.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega capacidades de negócio</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-capacidades-negocio.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/capacidades-negocio.json</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-colaboradores.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega dados de colaboradores</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-colaboradores.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/colaboradores.json</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-tecnologias.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega tecnologias do catálogo</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-tecnologias.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/tecnologias.csv</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-processos.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega processos de negócio</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-processos.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/processos-negocio.csv</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-slas.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega SLAs (Service Level Agreements)</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-slas.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/slas.csv</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-aplicacoes.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega aplicações/sistemas</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-aplicacoes.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/aplicacoes.csv</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Shell</Badge>
                                <code className="text-sm">load-servidores.sh</code>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm">Carrega servidores (físicos, virtuais e cloud)</p>
                              <div className="bg-muted p-3 rounded-md">
                                <code className="text-xs">./scripts/load-servidores.sh</code>
                              </div>
                              <p className="text-xs text-muted-foreground">Origem: data-templates/servidores.csv</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Pré-requisitos</h3>
                        <div className="bg-muted p-4 rounded-md space-y-2">
                          <p className="text-sm font-semibold">Ferramentas necessárias:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            <li><code className="bg-background px-1 py-0.5 rounded">bash</code> - Shell script interpreter</li>
                            <li><code className="bg-background px-1 py-0.5 rounded">curl</code> - Ferramenta para requisições HTTP</li>
                            <li><code className="bg-background px-1 py-0.5 rounded">jq</code> - Processador JSON para linha de comando</li>
                            <li>Servidor API rodando em <code className="bg-background px-1 py-0.5 rounded">http://localhost:3000</code></li>
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Como Usar</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold mb-2">1. Executar um script individual:</p>
                            <div className="bg-muted p-3 rounded-md">
                              <code className="text-xs">chmod +x scripts/load-tipos-afastamento.sh</code><br/>
                              <code className="text-xs">./scripts/load-tipos-afastamento.sh</code>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2">2. Executar todos os scripts:</p>
                            <div className="bg-muted p-3 rounded-md">
                              <code className="text-xs">chmod +x scripts/load-*.sh</code><br/>
                              <code className="text-xs">for script in scripts/load-*.sh; do $script; done</code>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2">3. Verificar logs:</p>
                            <div className="bg-muted p-3 rounded-md">
                              <code className="text-xs">tail -f logs/carga-dados.log</code>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Estrutura dos Scripts</h3>
                        <div className="bg-muted p-4 rounded-md">
                          <pre className="text-xs overflow-x-auto">{`#!/bin/bash

# Configurações
API_URL="http://localhost:3000/api"
DATA_FILE="data-templates/tipos-afastamento.json"

# Validar se API está disponível
if ! curl -s "$API_URL/health" > /dev/null; then
  echo "Erro: API não disponível em $API_URL"
  exit 1
fi

# Processar arquivo JSON
jq -c '.[]' "$DATA_FILE" | while read -r item; do
  curl -X POST "$API_URL/tipos-afastamento" \
    -H "Content-Type: application/json" \
    -d "$item"
  echo "Registro carregado"
done

echo "Carga concluída!"`}</pre>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Scripts Python (Alternativa)</h3>
                        <p className="text-sm text-muted-foreground">
                          Para cargas mais complexas, use Python com <code className="text-xs bg-muted px-1 py-0.5 rounded">requests</code> e <code className="text-xs bg-muted px-1 py-0.5 rounded">pandas</code>
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <pre className="text-xs overflow-x-auto">{`import requests
import json
import pandas as pd

API_URL = "http://localhost:3000/api"

# Carregar dados de CSV
df = pd.read_csv('data-templates/tipos-afastamento.csv')

# Converter para registros e enviar
for record in df.to_dict('records'):
    response = requests.post(
        f"{API_URL}/tipos-afastamento",
        json=record
    )
    if response.status_code == 201:
        print(f"✓ Carregado: {record['sigla']}")
    else:
        print(f"✗ Erro: {record['sigla']} - {response.text}")

print("Carga concluída!")`}</pre>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Troubleshooting</h3>
                        <div className="space-y-3">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Erro: "jq: command not found"</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-2">Instale o jq:</p>
                              <div className="bg-muted p-2 rounded">
                                <code className="text-xs">brew install jq</code> (macOS)<br/>
                                <code className="text-xs">sudo apt install jq</code> (Ubuntu/Debian)
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Erro: "Connection refused"</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">Verifique se a API está rodando:</p>
                              <div className="bg-muted p-2 rounded">
                                <code className="text-xs">curl http://localhost:3000/health</code>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Erro: "Permission denied"</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">Dê permissão de execução:</p>
                              <div className="bg-muted p-2 rounded">
                                <code className="text-xs">chmod +x scripts/*.sh</code>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {Object.entries(apiEndpoints).map(([key, endpoints]) => (
                  <TabsContent key={key} value={key} className="space-y-4 mt-6">
                    {endpoints.map((endpoint, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono">{endpoint.path}</code>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(endpoint.path)}
                            >
                              <Copy />
                            </Button>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {endpoint.requestBody && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Request Body</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(endpoint.requestBody!)}
                                >
                                  <Copy />
                                </Button>
                              </div>
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                <code className="text-xs font-mono">{endpoint.requestBody}</code>
                              </pre>
                            </div>
                          )}
                          {endpoint.response && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Response</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(endpoint.response!)}
                                >
                                  <Copy />
                                </Button>
                              </div>
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                <code className="text-xs font-mono">{endpoint.response}</code>
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Autenticação</CardTitle>
              <CardDescription>
                Todas as requisições devem incluir autenticação via token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Header de Autenticação</h4>
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <code className="text-xs font-mono">
                      Authorization: Bearer {'{'}token{'}'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Authorization: Bearer {token}')}
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Content-Type</h4>
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <code className="text-xs font-mono">
                      Content-Type: application/json
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Content-Type: application/json')}
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Códigos de Resposta HTTP</CardTitle>
              <CardDescription>
                Códigos de status retornados pela API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500 text-white">200</Badge>
                  <span className="text-sm">OK - Requisição bem-sucedida</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500 text-white">201</Badge>
                  <span className="text-sm">Created - Recurso criado com sucesso</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-yellow-500 text-white">400</Badge>
                  <span className="text-sm">Bad Request - Requisição inválida</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-yellow-500 text-white">401</Badge>
                  <span className="text-sm">Unauthorized - Autenticação necessária</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-yellow-500 text-white">404</Badge>
                  <span className="text-sm">Not Found - Recurso não encontrado</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-500 text-white">500</Badge>
                  <span className="text-sm">Internal Server Error - Erro no servidor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
