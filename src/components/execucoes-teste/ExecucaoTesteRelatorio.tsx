import { useEffect, useState } from 'react';
import { ExecucaoTeste } from '@/lib/types';
import { formatarDataHora } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from '@phosphor-icons/react';
import { Separator } from '@/components/ui/separator';

interface ExecucaoTesteRelatorioProps {
  execucao: ExecucaoTeste;
  open: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ExecucaoTesteRelatorio({ execucao, open, onClose }: ExecucaoTesteRelatorioProps) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (open && execucao.arquivoResultado && execucao.arquivoMimeType) {
      const imageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (imageTypes.includes(execucao.arquivoMimeType)) {
        setIsImage(true);
        // Carregar imagem
        loadImage();
      } else {
        setIsImage(false);
      }
    }

    return () => {
      if (imagemUrl) {
        URL.revokeObjectURL(imagemUrl);
      }
    };
  }, [open, execucao]);

  const loadImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/execucoes-teste/${execucao.id}/download`);
      if (!response.ok) return;
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImagemUrl(url);
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = globalThis.open('', '_blank');
    if (!printWindow) return;

    // Calcular duração da execução
    let duracao = 'Não disponível';
    if (execucao.dataHoraInicio && execucao.dataHoraTermino) {
      const inicio = new Date(execucao.dataHoraInicio);
      const termino = new Date(execucao.dataHoraTermino);
      const diffMs = termino.getTime() - inicio.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      duracao = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Execução de Teste</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              padding: 2cm 1.5cm; 
              color: #1a1a1a;
              line-height: 1.6;
            }
            h1 { 
              font-size: 26px; 
              margin-bottom: 8px; 
              color: #0f172a;
              font-weight: 700;
            }
            h2 { 
              font-size: 18px; 
              margin-top: 24px; 
              margin-bottom: 14px; 
              color: #334155;
              font-weight: 600;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
            }
            .header { 
              margin-bottom: 32px; 
              border-bottom: 3px solid #475569; 
              padding-bottom: 12px; 
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 24px; 
            }
            .info-item { 
              margin-bottom: 12px; 
              background: #f8fafc;
              padding: 10px 12px;
              border-radius: 6px;
              border-left: 3px solid #3b82f6;
            }
            .label { 
              font-size: 11px; 
              color: #64748b; 
              font-weight: 600; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px; 
            }
            .value { 
              font-size: 14px;
              color: #1e293b;
              font-weight: 500;
            }
            .value strong {
              color: #0f172a;
              font-weight: 700;
            }
            .separator { 
              height: 1px; 
              background: linear-gradient(to right, #e2e8f0, transparent); 
              margin: 24px 0; 
            }
            .text-box { 
              border: 1px solid #cbd5e1; 
              background: #f8fafc; 
              padding: 14px; 
              border-radius: 6px; 
              white-space: pre-wrap; 
              font-size: 13px; 
              margin-top: 8px;
              line-height: 1.7;
              color: #334155;
            }
            .footer { 
              margin-top: 48px; 
              padding-top: 20px; 
              border-top: 2px solid #cbd5e1; 
              font-size: 10px; 
              color: #64748b;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 13px;
              font-weight: 600;
              margin-top: 4px;
            }
            .status-sucesso { background: #dcfce7; color: #166534; }
            .status-falha { background: #fee2e2; color: #991b1b; }
            .status-bloqueado { background: #fef3c7; color: #92400e; }
            .status-nao-executado { background: #e5e7eb; color: #374151; }
            img { 
              max-width: 100%; 
              height: auto; 
              margin-top: 14px; 
              border: 2px solid #cbd5e1;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .evidence-box {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 16px;
              margin-top: 12px;
            }
            .metadata {
              display: flex;
              gap: 20px;
              margin-top: 12px;
              font-size: 12px;
              color: #64748b;
            }
            .metadata-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            @media print { 
              @page { 
                margin: 1.5cm; 
                size: A4;
              }
              body { padding: 0; }
              .no-break { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Execução de Teste</h1>
            <div class="metadata">
              <div class="metadata-item">
                <strong>Gerado em:</strong> ${formatarDataHora(new Date().toISOString())}
              </div>
              <div class="metadata-item">
                <strong>Sistema:</strong> CodeWiki - Auditoria
              </div>
            </div>
          </div>

          <h2><strong>1. Informações Básicas</strong></h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">ID da Execução</div>
              <div class="value"><strong>#${execucao.id}</strong></div>
            </div>
            <div class="info-item">
              <div class="label">Caso de Teste</div>
              <div class="value"><strong>${execucao.casoTesteTitulo || ''}</strong></div>
            </div>
            <div class="info-item">
              <div class="label">Requisito Vinculado</div>
              <div class="value">${execucao.requisitoVinculado || 'Não informado'}</div>
            </div>
            <div class="info-item">
              <div class="label">Ambiente</div>
              <div class="value"><strong>${execucao.ambiente}</strong></div>
            </div>
            <div class="info-item">
              <div class="label">Executor</div>
              <div class="value">${execucao.executorNome || ''}</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div class="value">
                <span class="status-badge status-${execucao.statusExecucao.toLowerCase()}">
                  ${execucao.statusExecucao}
                </span>
              </div>
            </div>
          </div>

          <div class="separator"></div>

          <h2><strong>2. Período de Execução</strong></h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Data/Hora Início</div>
              <div class="value">${formatarDataHora(execucao.dataHoraInicio)}</div>
            </div>
            <div class="info-item">
              <div class="label">Data/Hora Término</div>
              <div class="value">${execucao.dataHoraTermino ? formatarDataHora(execucao.dataHoraTermino) : 'Não informado'}</div>
            </div>
            ${duracao !== 'Não disponível' ? `
            <div class="info-item">
              <div class="label">Duração Total</div>
              <div class="value">${duracao}</div>
            </div>
            ` : ''}
          </div>

          ${execucao.registroAtividades || execucao.resultadoExecucao ? `
            <div class="separator"></div>
            <h2><strong>3. Registros</strong></h2>
            ${execucao.registroAtividades ? `
              <div class="no-break" style="margin-bottom: 20px;">
                <div class="label">Registro de Atividades</div>
                <div class="text-box">${execucao.registroAtividades}</div>
              </div>
            ` : ''}
            ${execucao.resultadoExecucao ? `
              <div class="no-break">
                <div class="label">Resultado da Execução</div>
                <div class="text-box">${execucao.resultadoExecucao}</div>
              </div>
            ` : ''}
          ` : ''}

          ${execucao.arquivoResultado ? `
            <div class="separator"></div>
            <h2><strong>4. Evidência</strong></h2>
            <div class="evidence-box">
              <div class="info-item" style="border-left: 3px solid #10b981;">
                <div class="label">Arquivo Anexado</div>
                <div class="value">${execucao.arquivoNomeOriginal || ''}</div>
              </div>
              ${execucao.arquivoTamanho ? `
                <div class="info-item" style="border-left: 3px solid #10b981;">
                  <div class="label">Tamanho do Arquivo</div>
                  <div class="value">${(execucao.arquivoTamanho / 1024).toFixed(2)} KB</div>
                </div>
              ` : ''}
              ${isImage && imagemUrl ? `
                <div style="margin-top: 20px;" class="no-break">
                  <div class="label">Captura de Tela</div>
                  <img src="${imagemUrl}" alt="Evidência do teste" />
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="footer">
            <div>
              <p><strong>CodeWiki</strong> - Sistema de Auditoria</p>
              <p>Relatório de Execução de Teste - ID: #${execucao.id}</p>
            </div>
            <div style="text-align: right;">
              <p>${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Escrever o documento com encoding UTF-8 correto
    printWindow.document.open();
    printWindow.document.write('\uFEFF'); // BOM UTF-8
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar o carregamento das imagens antes de imprimir
    if (isImage && imagemUrl) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } else {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>📊 Relatório de Execução de Teste</span>
            <Button onClick={handlePrint} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Imprimir/PDF
            </Button>
          </DialogTitle>
          <DialogDescription>
            Visualize e imprima os detalhes completos da execução do teste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6" id="relatorio-conteudo">
          {/* Cabeçalho para impressão */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold mb-2">Relatório de Execução de Teste</h1>
            <p className="text-sm text-gray-600">
              Gerado em: {formatarDataHora(new Date().toISOString())}
            </p>
          </div>

          {/* Informações Básicas */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold mb-4">
              1. Informações Básicas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ID da Execução</p>
                <p className="text-sm font-bold">#{execucao.id}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Caso de Teste</p>
                <p className="text-sm font-semibold">{execucao.casoTesteTitulo}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requisito Vinculado</p>
                <p className="text-sm">{execucao.requisitoVinculado || 'Não informado'}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ambiente</p>
                <p className="text-sm font-semibold">{execucao.ambiente}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Executor</p>
                <p className="text-sm">{execucao.executorNome}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  execucao.statusExecucao === 'Passou' ? 'bg-green-100 text-green-800' :
                  execucao.statusExecucao === 'Falhou' ? 'bg-red-100 text-red-800' :
                  execucao.statusExecucao === 'Bloqueado' ? 'bg-yellow-100 text-yellow-800' :
                  execucao.statusExecucao === 'Cancelado' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {execucao.statusExecucao}
                </span>
              </div>
            </div>
          </div>

          <Separator className="print:my-4" />

          {/* Datas */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold mb-4">
              2. Período de Execução
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Data/Hora Início</p>
                <p className="text-sm">{formatarDataHora(execucao.dataHoraInicio)}</p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Data/Hora Término</p>
                <p className="text-sm">
                  {execucao.dataHoraTermino 
                    ? formatarDataHora(execucao.dataHoraTermino) 
                    : 'Não informado'}
                </p>
              </div>
              {execucao.dataHoraInicio && execucao.dataHoraTermino && (() => {
                const inicio = new Date(execucao.dataHoraInicio);
                const termino = new Date(execucao.dataHoraTermino);
                const diffMs = termino.getTime() - inicio.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                const duracao = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
                return (
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duração Total</p>
                    <p className="text-sm font-bold text-green-700">{duracao}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          <Separator className="print:my-4" />

          {/* Registros */}
          {(execucao.registroAtividades || execucao.resultadoExecucao) && (
            <>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h2 className="text-lg font-bold mb-4">
                  3. Registros
                </h2>
                
                {execucao.registroAtividades && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Registro de Atividades
                    </p>
                    <div className="text-sm p-4 bg-white rounded-md whitespace-pre-wrap border-l-4 border-blue-500 shadow-sm">
                      {execucao.registroAtividades}
                    </div>
                  </div>
                )}
                
                {execucao.resultadoExecucao && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Resultado da Execução
                    </p>
                    <div className="text-sm p-4 bg-white rounded-md whitespace-pre-wrap border-l-4 border-green-500 shadow-sm">
                      {execucao.resultadoExecucao}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="print:my-4" />
            </>
          )}

          {/* Evidência */}
          {execucao.arquivoResultado && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-lg font-bold mb-4">
                4. Evidência
              </h2>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border-l-4 border-emerald-500">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Arquivo Anexado
                  </p>
                  <p className="text-sm">{execucao.arquivoNomeOriginal}</p>
                </div>
                {execucao.arquivoTamanho && (
                  <div className="bg-white p-3 rounded border-l-4 border-emerald-500">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Tamanho do Arquivo
                    </p>
                    <p className="text-sm">
                      {(execucao.arquivoTamanho / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
                
                {/* Exibir imagem se for PNG/JPG/JPEG */}
                {isImage && imagemUrl && (
                  <div className="mt-4 bg-white p-4 rounded border">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Captura de Tela
                    </p>
                    <div className="border-2 rounded-lg p-2 bg-gray-50 shadow-inner">
                      <img 
                        src={imagemUrl} 
                        alt="Evidência do teste" 
                        className="max-w-full h-auto rounded shadow-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rodapé para impressão */}
          <div className="hidden print:block mt-8 pt-4 border-t-2 text-xs text-gray-500 flex justify-between">
            <div>
              <p className="font-bold">CodeWiki - Sistema de Auditoria</p>
              <p>Relatório de Execução de Teste - ID: #{execucao.id}</p>
            </div>
            <p>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
