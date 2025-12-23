import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Habilidade, DominioHabilidade, CategoriaTecnologia } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLogging } from '@/hooks/use-logging';

const habilidadeSchema = z.object({
  sigla: z.string()
    .min(1, 'Sigla é obrigatória')
    .max(30, 'Sigla deve ter no máximo 30 caracteres'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['Soft Skills', 'Hard Skills']),
  dominio: z.enum([
    'Arquitetura & Integração de Sistemas',
    'Comunicação & Relacionamento',
    'Dados & Informação',
    'Desenvolvimento & Engenharia',
    'DevOps & DevSecOps',
    'ERP & Plataformas Corporativas',
    'Ética & Postura Profissional',
    'Gestão & Organização',
    'Liderança & Influência',
    'Pensamento Estratégico',
    'Segurança & Compliance'
  ]),
  subcategoria: z.enum([
    'Aplicação Terceira',
    'Banco de Dados',
    'Frontend',
    'Backend',
    'Infraestrutura',
    'Devops',
    'Segurança',
    'Analytics',
    'Integração',
    'Inteligencia Artificial',
    'Outras'
  ])
});

type HabilidadeFormValues = z.infer<typeof habilidadeSchema>;

interface HabilidadeFormProps {
  habilidade?: Habilidade;
  onSave: (habilidade: Habilidade) => void;
  onCancel: () => void;
}

export function HabilidadeForm({ habilidade, onSave, onCancel }: HabilidadeFormProps) {
  const { logClick } = useLogging('habilidade-form');

  const form = useForm<HabilidadeFormValues>({
    resolver: zodResolver(habilidadeSchema),
    defaultValues: {
      sigla: habilidade?.sigla || '',
      descricao: habilidade?.descricao || '',
      tipo: habilidade?.tipo || 'Hard Skills',
      dominio: habilidade?.dominio || 'Desenvolvimento & Engenharia',
      subcategoria: habilidade?.subcategoria || 'Outras'
    }
  });

  const onSubmit = (data: HabilidadeFormValues) => {
    const novaHabilidade: Habilidade = {
      id: habilidade?.id || crypto.randomUUID(),
      sigla: data.sigla,
      descricao: data.descricao,
      tipo: data.tipo,
      dominio: data.dominio,
      subcategoria: data.subcategoria,
      certificacoes: habilidade?.certificacoes || []
    };

    console.log('[HabilidadeForm] Salvando habilidade:', novaHabilidade);
    onSave(novaHabilidade);
    logClick(habilidade ? 'habilidade_updated' : 'habilidade_created', {
      habilidade_id: novaHabilidade.id,
      tipo: novaHabilidade.tipo,
      dominio: novaHabilidade.dominio,
      subcategoria: novaHabilidade.subcategoria
    });
    toast.success(habilidade ? 'Habilidade atualizada com sucesso' : 'Habilidade criada com sucesso');
  };

  const isEditing = !!habilidade;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              <X className="mr-2" />
              Cancelar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Editar Habilidade' : 'Nova Habilidade'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Preencha as informações da habilidade
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Habilidade</CardTitle>
              <CardDescription>
                Defina o domínio, subcategoria e descrição da habilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="sigla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sigla</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite a sigla" maxLength={30} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                              <SelectItem value="Hard Skills">Hard Skills</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dominio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domínio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o domínio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Arquitetura & Integração de Sistemas">Arquitetura & Integração de Sistemas</SelectItem>
                              <SelectItem value="Comunicação & Relacionamento">Comunicação & Relacionamento</SelectItem>
                              <SelectItem value="Dados & Informação">Dados & Informação</SelectItem>
                              <SelectItem value="Desenvolvimento & Engenharia">Desenvolvimento & Engenharia</SelectItem>
                              <SelectItem value="DevOps & DevSecOps">DevOps & DevSecOps</SelectItem>
                              <SelectItem value="ERP & Plataformas Corporativas">ERP & Plataformas Corporativas</SelectItem>
                              <SelectItem value="Ética & Postura Profissional">Ética & Postura Profissional</SelectItem>
                              <SelectItem value="Gestão & Organização">Gestão & Organização</SelectItem>
                              <SelectItem value="Liderança & Influência">Liderança & Influência</SelectItem>
                              <SelectItem value="Pensamento Estratégico">Pensamento Estratégico</SelectItem>
                              <SelectItem value="Segurança & Compliance">Segurança & Compliance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a subcategoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Aplicação Terceira">Aplicação Terceira</SelectItem>
                              <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
                              <SelectItem value="Frontend">Frontend</SelectItem>
                              <SelectItem value="Backend">Backend</SelectItem>
                              <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                              <SelectItem value="Devops">Devops</SelectItem>
                              <SelectItem value="Segurança">Segurança</SelectItem>
                              <SelectItem value="Analytics">Analytics</SelectItem>
                              <SelectItem value="Integração">Integração</SelectItem>
                              <SelectItem value="Inteligencia Artificial">Inteligência Artificial</SelectItem>
                              <SelectItem value="Outras">Outras</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva a habilidade em detalhes"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      <X className="mr-2" />
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Check className="mr-2" />
                      {isEditing ? 'Salvar Alterações' : 'Criar Habilidade'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
