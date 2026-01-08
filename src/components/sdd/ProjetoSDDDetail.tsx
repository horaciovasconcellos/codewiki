import { useState } from 'react';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ProjetoSDD } from '@/types/sdd';
import { ProjetoSDDForm } from './ProjetoSDDForm';
import { RequisitosList } from './RequisitosList';
import ReactMarkdown from 'react-markdown';

interface ProjetoSDDDetailProps {
  projeto: ProjetoSDD;
  onBack: () => void;
}

export function ProjetoSDDDetail({ projeto: initialProjeto, onBack }: ProjetoSDDDetailProps) {
  const [projeto, setProjeto] = useState(initialProjeto);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleUpdate = async () => {
    // Recarregar projeto atualizado
    const response = await fetch(`/api/sdd/projetos/${projeto.id}`);
    const updated = await response.json();
    setProjeto(updated);
    setShowEditForm(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-4 border-b px-6 py-3" style={{backgroundColor: 'var(--card-bg)'}}>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold" style={{color: 'var(--card-text)'}}>
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
      </header>

      <div className="flex-1 overflow-auto p-6">
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
              </div>
            </CardContent>
          </Card>

          {/* Bloco 2: Requisitos / Histórias de Usuário */}
          <RequisitosList projetoId={projeto.id} />

          {/* Bloco 3: Tarefas aparece dentro dos requisitos expandidos */}
        </div>
      </div>

      {showEditForm && (
        <ProjetoSDDForm
          projeto={projeto}
          onClose={() => setShowEditForm(false)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
