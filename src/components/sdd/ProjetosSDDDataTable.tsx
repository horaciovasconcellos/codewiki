import { useState } from 'react';
import { ProjetoSDD } from '@/types/sdd';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash, Eye, Printer, Download } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ProjetosSDDDataTableProps {
  projetos: ProjetoSDD[];
  onEdit: (projeto: ProjetoSDD) => void;
  onDelete: (projeto: ProjetoSDD) => void;
  onView: (projeto: ProjetoSDD) => void;
}

export function ProjetosSDDDataTable({
  projetos,
  onEdit,
  onDelete,
  onView,
}: ProjetosSDDDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = 10;

  // Função para buscar dados completos de um projeto
  const fetchProjetoCompleto = async (projetoId: string) => {
    try {
      const [projetoRes, requisitosRes] = await Promise.all([
        fetch(`/api/sdd/projetos/${projetoId}`),
        fetch(`/api/sdd/requisitos/${projetoId}`)
      ]);

      const projeto = await projetoRes.json();
      const requisitos = await requisitosRes.json();

      // Buscar tarefas de cada requisito
      const requisitosComTarefas = await Promise.all(
        requisitos.map(async (req: any) => {
          const tarefasRes = await fetch(`/api/sdd/tarefas/${req.id}`);
          const tarefas = await tarefasRes.json();
          return { ...req, tarefas };
        })
      );

      return { projeto, requisitos: requisitosComTarefas };
    } catch (error) {
      console.error('Erro ao buscar dados completos:', error);
      throw error;
    }
  };

  // Função para gerar HTML de impressão
  const gerarHTMLImpressao = (dados: any) => {
    const { projeto, requisitos } = dados;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Projeto SDD - ${projeto.nome_projeto}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { color: #1a1a1a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #2563eb; border-bottom: 2px solid #93c5fd; padding-bottom: 8px; margin-top: 30px; }
          h3 { color: #1e40af; margin-top: 20px; }
          .projeto-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { margin: 5px 0; }
          .info-label { font-weight: 600; color: #475569; }
          .requisito { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; break-inside: avoid; }
          .requisito-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .sequencia { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600; }
          .status { padding: 4px 12px; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
          .status-backlog { background: #f1f5f9; color: #475569; }
          .status-refinamento { background: #dbeafe; color: #1e40af; }
          .status-pronto { background: #dcfce7; color: #166534; }
          .status-done { background: #e9d5ff; color: #6b21a8; }
          .tarefa { background: #fafafa; border-left: 3px solid #94a3b8; padding: 10px; margin: 10px 0; }
          .tarefa-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .tarefa-status { padding: 2px 8px; border-radius: 3px; font-size: 0.75rem; font-weight: 500; }
          .status-todo { background: #f1f5f9; color: #475569; }
          .status-inprogress { background: #dbeafe; color: #1e40af; }
          .status-done-tarefa { background: #dcfce7; color: #166534; }
          .descricao { white-space: pre-wrap; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .requisito, .tarefa { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Projeto SDD: ${projeto.nome_projeto}</h1>
        
        <div class="projeto-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">IA Selecionada:</span> ${projeto.ia_selecionada}
            </div>
            <div class="info-item">
              <span class="info-label">Aplicação:</span> ${projeto.aplicacao_sigla ? `${projeto.aplicacao_sigla} - ${projeto.aplicacao_nome}` : 'Sem aplicação'}
            </div>
            <div class="info-item">
              <span class="info-label">Gerador de Projetos:</span> ${projeto.gerador_projetos ? 'Ativo' : 'Inativo'}
            </div>
            <div class="info-item">
              <span class="info-label">Data de Criação:</span> ${new Date(projeto.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        ${projeto.constituicao ? `
          <h2>📜 Constituição do Projeto</h2>
          <div class="descricao">${projeto.constituicao}</div>
        ` : ''}

        <h2>📝 Requisitos / Histórias de Usuário</h2>
    `;

    if (requisitos.length === 0) {
      html += '<p><em>Nenhum requisito cadastrado</em></p>';
    } else {
      requisitos.forEach((req: any) => {
        const statusClass = req.status.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '');
        html += `
          <div class="requisito">
            <div class="requisito-header">
              <span class="sequencia">${req.sequencia}</span>
              <span class="status status-${statusClass}">${req.status}</span>
            </div>
            <h3>${req.nome}</h3>
            ${req.descricao ? `<div class="descricao">${req.descricao}</div>` : ''}
            
            ${req.tarefas && req.tarefas.length > 0 ? `
              <h4>✓ Tarefas (${req.tarefas.filter((t: any) => t.status === 'DONE').length}/${req.tarefas.length})</h4>
              ${req.tarefas.map((tarefa: any) => `
                <div class="tarefa">
                  <div class="tarefa-header">
                    <div>
                      <strong>Descrição:</strong>
                      <div class="descricao">${tarefa.descricao}</div>
                    </div>
                    <span class="tarefa-status status-${tarefa.status.toLowerCase().replace(/\s+/g, '')}">${tarefa.status}</span>
                  </div>
                  <div style="font-size: 0.875rem; color: #64748b; margin-top: 5px;">
                    <strong>Início:</strong> ${new Date(tarefa.data_inicio).toLocaleDateString('pt-BR')} 
                    ${tarefa.data_termino ? `| <strong>Término:</strong> ${new Date(tarefa.data_termino).toLocaleDateString('pt-BR')}` : ''}
                    ${tarefa.dias_decorridos ? `| <strong>Dias:</strong> ${tarefa.dias_decorridos}` : ''}
                  </div>
                </div>
              `).join('')}
            ` : '<p style="color: #64748b; font-size: 0.875rem;"><em>Nenhuma tarefa cadastrada</em></p>'}
          </div>
        `;
      });
    }

    html += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 0.875rem;">
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
      </body>
      </html>
    `;

    return html;
  };

  // Função para imprimir um projeto individual
  const handlePrintProjeto = async (projeto: ProjetoSDD) => {
    try {
      toast.loading('Preparando impressão...');
      const dados = await fetchProjetoCompleto(projeto.id);
      const html = gerarHTMLImpressao(dados);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          toast.success('Documento pronto para impressão!');
        }, 500);
      }
    } catch (error) {
      toast.error('Erro ao preparar impressão');
    }
  };

  // Função para exportar todos os projetos
  const handleExportarTodos = async () => {
    try {
      setExporting(true);
      toast.loading('Exportando todos os projetos...');

      const dadosCompletos = await Promise.all(
        projetos.map(projeto => fetchProjetoCompleto(projeto.id))
      );

      let htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Exportação Completa - Projetos SDD</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            .projeto-section { page-break-before: always; margin-bottom: 60px; }
            .projeto-section:first-child { page-break-before: auto; }
            h1 { color: #1a1a1a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #2563eb; border-bottom: 2px solid #93c5fd; padding-bottom: 8px; margin-top: 30px; }
            h3 { color: #1e40af; margin-top: 20px; }
            .projeto-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .info-item { margin: 5px 0; }
            .info-label { font-weight: 600; color: #475569; }
            .requisito { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; break-inside: avoid; }
            .requisito-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .sequencia { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600; }
            .status { padding: 4px 12px; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
            .status-backlog { background: #f1f5f9; color: #475569; }
            .status-refinamento { background: #dbeafe; color: #1e40af; }
            .status-pronto { background: #dcfce7; color: #166534; }
            .status-done { background: #e9d5ff; color: #6b21a8; }
            .tarefa { background: #fafafa; border-left: 3px solid #94a3b8; padding: 10px; margin: 10px 0; }
            .tarefa-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .tarefa-status { padding: 2px 8px; border-radius: 3px; font-size: 0.75rem; font-weight: 500; }
            .status-todo { background: #f1f5f9; color: #475569; }
            .status-inprogress { background: #dbeafe; color: #1e40af; }
            .status-done-tarefa { background: #dcfce7; color: #166534; }
            .descricao { white-space: pre-wrap; margin: 10px 0; }
            @media print {
              body { padding: 0; }
              .requisito, .tarefa { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; font-size: 2rem; margin-bottom: 40px;">
            📚 Exportação Completa - Projetos SDD
          </h1>
          <div style="text-align: center; color: #64748b; margin-bottom: 40px;">
            Total de ${projetos.length} projeto(s) | Gerado em ${new Date().toLocaleString('pt-BR')}
          </div>
      `;

      dadosCompletos.forEach((dados, index) => {
        htmlCompleto += `<div class="projeto-section">`;
        htmlCompleto += gerarHTMLImpressao(dados).replace(/<!DOCTYPE html>.*?<body>/s, '').replace(/<\/body>.*?<\/html>/s, '');
        htmlCompleto += `</div>`;
      });

      htmlCompleto += `
        </body>
        </html>
      `;

      const blob = new Blob([htmlCompleto], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projetos-sdd-completo-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar projetos');
    } finally {
      setExporting(false);
    }
  };

  const filteredProjetos = projetos.filter((projeto) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      projeto.nome_projeto.toLowerCase().includes(searchLower) ||
      projeto.aplicacao_sigla?.toLowerCase().includes(searchLower) ||
      projeto.aplicacao_nome?.toLowerCase().includes(searchLower) ||
      projeto.ia_selecionada.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredProjetos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjetos = filteredProjetos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <div className="text-sm text-muted-foreground">
            {filteredProjetos.length} projeto(s) encontrado(s)
          </div>
        </div>
        <Button 
          onClick={handleExportarTodos} 
          disabled={exporting || projetos.length === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          {exporting ? 'Exportando...' : 'Exportar Todos'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>IA Selecionada</TableHead>
              <TableHead>Gerador de Projetos</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProjetos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum projeto encontrado
                </TableCell>
              </TableRow>
            ) : (
              currentProjetos.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">{projeto.nome_projeto}</TableCell>
                  <TableCell>
                    {projeto.aplicacao_sigla ? (
                      <div>
                        <div className="font-medium">{projeto.aplicacao_sigla}</div>
                        <div className="text-sm text-muted-foreground">
                          {projeto.aplicacao_nome}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{projeto.ia_selecionada}</TableCell>
                  <TableCell>
                    {projeto.gerador_projetos ? (
                      <span className="text-green-600 font-medium">Ativo</span>
                    ) : (
                      <span className="text-muted-foreground">Inativo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(projeto.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(projeto)}
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrintProjeto(projeto)}
                        title="Imprimir projeto com requisitos e tarefas"
                      >
                        <Printer size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(projeto)}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(projeto)}
                        title="Excluir"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
