import { useState, useRef } from 'react';
import { Script, TipoScript } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Check, UploadSimple, X, FileText } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';

interface ScriptWizardProps {
  scripts: Script[];
  onSave: (script: Script, arquivo?: File) => void;
  onCancel: () => void;
  editingScript?: Script;
}

const tiposScript: TipoScript[] = [
  'Automação',
  'Administração',
  'Banco de Dados',
  'Integração',
  'Testes',
  'Build & Deploy',
  'CI/CD',
  'Infraestrutura (IaC)',
  'Monitoramento',
  'Segurança',
  'Governança',
  'Dados',
  'ERP',
  'Documentação',
];

export function ScriptWizard({ scripts, onSave, onCancel, editingScript }: ScriptWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const formatDateForInput = (date?: string) => {
    if (!date) return '';
    return date.split('T')[0];
  };

  const [sigla, setSigla] = useState(editingScript?.sigla || '');
  const [descricao, setDescricao] = useState(editingScript?.descricao || '');
  const [dataInicio, setDataInicio] = useState(
    editingScript?.dataInicio ? formatDateForInput(editingScript.dataInicio) : getTodayDate()
  );
  const [dataTermino, setDataTermino] = useState(
    editingScript?.dataTermino ? formatDateForInput(editingScript.dataTermino) : ''
  );
  const [tipoScript, setTipoScript] = useState<TipoScript | ''>(
    editingScript?.tipoScript || ''
  );
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoAtual, setArquivoAtual] = useState(editingScript?.arquivo || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (limite de 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('O arquivo não pode ser maior que 50MB');
        return;
      }
      setArquivo(file);
      toast.success(`Arquivo "${file.name}" selecionado`);
    }
  };

  const handleRemoveFile = () => {
    setArquivo(null);
    setArquivoAtual('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    // Validações
    if (!sigla.trim()) {
      toast.error('Preencha a sigla do script');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Preencha a descrição do script');
      return;
    }

    if (!dataInicio) {
      toast.error('Preencha a data de início');
      return;
    }

    if (!tipoScript) {
      toast.error('Selecione o tipo de script');
      return;
    }

    // Validar data de término se preenchida
    if (dataTermino && dataTermino < dataInicio) {
      toast.error('A data de término não pode ser anterior à data de início');
      return;
    }

    const script: Script = {
      id: editingScript?.id || crypto.randomUUID(),
      sigla: sigla.trim(),
      descricao: descricao.trim(),
      dataInicio,
      dataTermino: dataTermino || undefined,
      tipoScript,
      arquivo: arquivo ? arquivo.name : arquivoAtual,
    };

    onSave(script, arquivo || undefined);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {editingScript ? 'Editar Script' : 'Novo Script'}
            </CardTitle>
            <CardDescription>
              Preencha as informações do script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sigla">
                  Sigla <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sigla"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ex: SCR-001"
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoScript">
                  Tipo de Script <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={tipoScript}
                  onValueChange={(value) => setTipoScript(value as TipoScript)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposScript.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o propósito e funcionalidade do script"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {descricao.length}/500 caracteres
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">
                  Data de Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataTermino">Data de Término</Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo do Script</Label>
              <div className="space-y-2">
                {(arquivo || arquivoAtual) ? (
                  <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {arquivo ? arquivo.name : arquivoAtual}
                        </div>
                        {arquivo && (
                          <div className="text-sm text-muted-foreground">
                            {(arquivo.size / 1024).toFixed(2)} KB
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadSimple size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <div className="text-sm font-medium mb-1">
                      Clique para fazer upload ou arraste o arquivo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tamanho máximo: 50MB
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="arquivo"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".sh,.ps1,.py,.js,.ts,.sql,.yaml,.yml,.json,.xml,.txt"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Formatos aceitos: .sh, .ps1, .py, .js, .ts, .sql, .yaml, .yml, .json, .xml, .txt
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                <Check className="mr-2" />
                {editingScript ? 'Salvar Alterações' : 'Cadastrar Script'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
