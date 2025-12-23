import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Habilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowRight, X } from '@phosphor-icons/react';

const habilidadeBasicSchema = z.object({
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
    'Backend',
    'Cloud',
    'Dados',
    'Frontend',
    'Mobile',
    'Operacional',
    'Outras',
    'Plataforma'
  ])
});

type HabilidadeBasicFormData = z.infer<typeof habilidadeBasicSchema>;

interface HabilidadeBasicFormProps {
  habilidade?: Partial<Habilidade>;
  onSave: (data: Partial<Habilidade>) => void;
  onCancel: () => void;
}

export function HabilidadeBasicForm({ habilidade, onSave, onCancel }: HabilidadeBasicFormProps) {
  const form = useForm<HabilidadeBasicFormData>({
    resolver: zodResolver(habilidadeBasicSchema),
    defaultValues: {
      sigla: habilidade?.sigla || '',
      descricao: habilidade?.descricao || '',
      tipo: habilidade?.tipo || 'Hard Skills',
      dominio: habilidade?.dominio || 'Desenvolvimento & Engenharia',
      subcategoria: habilidade?.subcategoria || 'Backend'
    }
  });

  const handleSubmit = (data: HabilidadeBasicFormData) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sigla"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sigla</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ABCD-1234" maxLength={9} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Dados">Dados</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Outras">Outras</SelectItem>
                    <SelectItem value="Plataforma">Plataforma</SelectItem>
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
                <Input placeholder="Digite uma descrição" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit">
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
