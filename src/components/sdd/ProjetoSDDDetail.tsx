import { useState } from 'react';
import { ArrowLeft, Edit, FileText, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjetoSDD } from '@/types/sdd';
import { ProjetoSDDForm } from './ProjetoSDDForm';
import { RequisitosList } from './RequisitosList';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ProjetoSDDDetailProps {
  projeto: ProjetoSDD;
  onBack: () => void;
}

export function ProjetoSDDDetail({ projeto: initialProjeto, onBack }: ProjetoSDDDetailProps) {
  const [projeto, setProjeto] = useState(initialProjeto);
  const [showEditForm, setShowEditForm] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleUpdate = async () => {
    // Recarregar projeto atualizado
    const response = await fetch(`/api/sdd/projetos/${projeto.id}`);
    const updated = await response.json();
    setProjeto(updated);
    setShowEditForm(false);
  };

  const handleExtractRequirements = async () => {
    if (!projeto.prd_content) {
      toast.error('Este projeto não possui um PRD cadastrado');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch(`/api/sdd/projetos/${projeto.id}/extrair-requisitos-prd`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao extrair requisitos');
      }

      const result = await response.json();
      toast.success(`${result.requisitosExtraidos} requisitos extraídos do PRD com sucesso!`);
      
      // Recarregar a página ou atualizar lista de requisitos
      window.location.reload();
    } catch (error) {
      console.error('Erro ao extrair requisitos:', error);
      toast.error('Erro ao extrair requisitos do PRD');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <div>
                <h1 className="text-2xl font-bold">
                  {projeto.nome_projeto}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {projeto.aplicacao_nome ? `${projeto.aplicacao_sigla} - ${projeto.aplicacao_nome}` : 'Sem aplicação'}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline">{projeto.ia_selecionada}</Badge>
          {projeto.gerador_projetos && (
            <Badge className="bg-green-100 text-green-800">Gerador Ativo</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        <Separator />

        <div className="space-y-6">
          {/* Bloco 1: Projeto SDD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Projeto SDD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Nome do Projeto</Label>
                  <p className="text-sm">{projeto.nome_projeto}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">IA Selecionada</Label>
                  <p className="text-sm">{projeto.ia_selecionada}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Aplicação</Label>
                  <p className="text-sm">
                    {projeto.aplicacao_nome ? `${projeto.aplicacao_sigla} - ${projeto.aplicacao_nome}` : 'Sem aplicação'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Gerador de Projetos</Label>
                  <p className="text-sm">{projeto.gerador_projetos ? 'Ativo' : 'Inativo'}</p>
                </div>
                {projeto.constituicao && (
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold">Constituição</Label>
                    <div className="mt-2 prose prose-sm max-w-none max-h-[6rem] overflow-y-auto border rounded-md p-3 bg-muted/30">
                      <ReactMarkdown>{projeto.constituicao}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {projeto.prd_content && (
                  <div className="col-span-2 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <FileCode className="w-4 h-4" />
                        PRD (Product Requirements Document)
                      </Label>
                      <Button
                        size="sm"
                        onClick={handleExtractRequirements}
                        disabled={extracting}
                        variant="outline"
                      >
                        {extracting ? 'Extraindo...' : 'Extrair Requisitos do PRD'}
                      </Button>
                    </div>
                    <div className="mt-2 prose prose-sm max-w-none max-h-[20rem] overflow-y-auto border rounded-md p-4 bg-muted/30">
                      <ReactMarkdown>{projeto.prd_content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bloco 2: Requisitos / Histórias de Usuário */}
          <RequisitosList projetoId={projeto.id} />

          {/* Bloco 3: Tarefas aparece dentro dos requisitos expandidos */}
        </div>

        {showEditForm && (
          <ProjetoSDDForm
            projeto={projeto}
            onClose={() => setShowEditForm(false)}
            onSave={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
