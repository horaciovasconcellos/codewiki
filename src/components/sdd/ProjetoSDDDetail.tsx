import { useState } from 'react';
import { ArrowLeft, Edit, FileText, ListTodo, CheckSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProjetoSDD } from '@/types/sdd';
import { ProjetoSDDForm } from './ProjetoSDDForm';
import { RequisitosList } from './RequisitosList';
import { DecisoesArquiteturaisList } from './DecisoesArquiteturaisList';
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
        <Tabs defaultValue="requisitos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requisitos" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Requisitos
            </TabsTrigger>
            <TabsTrigger value="decisoes" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Decisões Arquiteturais
            </TabsTrigger>
            <TabsTrigger value="constituicao" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Constituição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requisitos">
            <RequisitosList projetoId={projeto.id} />
          </TabsContent>

          <TabsContent value="decisoes">
            <DecisoesArquiteturaisList projetoId={projeto.id} />
          </TabsContent>

          <TabsContent value="constituicao">
            <Card>
              <CardHeader>
                <CardTitle>Constituição do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                {projeto.constituicao ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{projeto.constituicao}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Nenhuma constituição definida</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
