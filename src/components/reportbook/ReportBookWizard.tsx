import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash, FileArrowDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useLogging } from '@/hooks/use-logging';

interface Report {
  id?: string;
  nome: string;
  descricao: string;
  filtros: string;
  agrupamentos: string;
  status: 'Especificacao' | 'Aceito' | 'Rejeitado' | 'Obsoleto' | 'Substituido' | 'Producao';
  query: string;
  columns: ReportColumn[];
}

interface ReportColumn {
  id?: string;
  columnName: string;
  dataType: string;
  orderDirection: 'ASC' | 'DESC';
  description: string;
  query: string;
}

interface ReportBookWizardProps {
  report?: any;
  onSave: (report: Report) => void;
  onCancel: () => void;
}

const dataTypes = [
  'VARCHAR', 'CHAR', 'TEXT',
  'INT', 'BIGINT', 'DECIMAL', 'NUMERIC',
  'DATE', 'TIMESTAMP', 'DATETIME',
  'BOOLEAN', 'JSON', 'UUID'
];

export function ReportBookWizard({ report, onSave, onCancel }: ReportBookWizardProps) {
  const { logClick, logEvent, logError } = useLogging('reportbook-wizard');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Report>({
    nome: '',
    descricao: '',
    filtros: '',
    agrupamentos: '',
    status: 'Especificacao',
    query: '',
    columns: []
  });

  const [newColumn, setNewColumn] = useState<ReportColumn>({
    columnName: '',
    dataType: 'VARCHAR',
    orderDirection: 'ASC',
    description: '',
    query: ''
  });

  const [csvText, setCsvText] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [sqlSelect, setSqlSelect] = useState('');
  const [showSqlImport, setShowSqlImport] = useState(false);

  useEffect(() => {
    if (report) {
      console.log('Report recebido no Wizard:', report);
      console.log('Colunas do report:', report.columns);
      
      // Normalizar as colunas vindas da API
      const normalizedColumns = (report.columns || []).map((col: any) => ({
        id: col.id,
        columnName: col.columnName || col.column_name,
        dataType: col.dataType || col.data_type,
        orderDirection: col.orderDirection || col.order_direction,
        description: col.description,
        query: col.query
      }));
      
      console.log('Colunas normalizadas:', normalizedColumns);
      
      setFormData({
        id: report.id,
        nome: report.nome || '',
        descricao: report.descricao || '',
        filtros: report.filtros || '',
        agrupamentos: report.agrupamentos || '',
        status: report.status || 'Especificacao',
        query: report.query || '',
        columns: normalizedColumns
      });
      
      console.log('FormData após setFormData - total de colunas:', normalizedColumns.length);
    }
  }, [report]);

  const handleAddColumn = () => {
    if (!newColumn.columnName) {
      toast.error('Nome da coluna é obrigatório');
      return;
    }

    logClick('add_column', { column_name: newColumn.columnName, data_type: newColumn.dataType });
    setFormData(prev => ({
      ...prev,
      columns: [...prev.columns, { ...newColumn, id: uuidv4() }]
    }));

    setNewColumn({
      columnName: '',
      dataType: 'VARCHAR',
      orderDirection: 'ASC',
      description: '',
      query: ''
    });

    logEvent('column_added', 'input', { total_columns: formData.columns.length + 1 });
    toast.success('Coluna adicionada');
  };

  const handleRemoveColumn = (index: number) => {
    const column = formData.columns[index];
    logClick('remove_column', { column_name: column.columnName });
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
    logEvent('column_removed', 'click', { total_columns: formData.columns.length - 1 });
    toast.success('Coluna removida');
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) {
      toast.error('Cole o texto CSV para importar');
      return;
    }

    logClick('import_csv_button');
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length === 0) {
        toast.error('CSV vazio');
        return;
      }

      const importedColumns: ReportColumn[] = [];
      
      // Detectar separador (vírgula ou ponto-e-vírgula)
      const separator = lines[0].includes(';') ? ';' : ',';
      
      // Verificar se tem cabeçalho
      const hasHeader = lines[0].toLowerCase().includes('column_name') || 
                       lines[0].toLowerCase().includes('nome') ||
                       lines[0].toLowerCase().includes('name');
      
      const startLine = hasHeader ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ''));
        
        console.log('Processando linha:', line);
        console.log('Parts:', parts);
        
        if (parts.length >= 2) {
          // Corrigir tipos comuns com erro de digitação
          let dataType = parts[1] || 'VARCHAR';
          if (dataType.toUpperCase().includes('VARCHA')) {
            dataType = 'VARCHAR';
          }
          
          const column: ReportColumn = {
            id: uuidv4(),
            columnName: parts[0] || '',
            dataType: dataType,
            orderDirection: (parts[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
            description: parts[3] || '',
            query: parts[4] || ''
          };

          // Validar tipos de dados
          const validTypes = ['VARCHAR', 'CHAR', 'TEXT', 'INT', 'BIGINT', 'DECIMAL', 'NUMERIC', 
                            'DATE', 'TIMESTAMP', 'DATETIME', 'BOOLEAN', 'JSON', 'UUID'];
          if (!validTypes.includes(column.dataType.toUpperCase())) {
            console.log('Tipo inválido detectado:', column.dataType, '- convertendo para VARCHAR');
            column.dataType = 'VARCHAR';
          } else {
            column.dataType = column.dataType.toUpperCase();
          }

          if (column.columnName) {
            console.log('Coluna adicionada:', column);
            importedColumns.push(column);
          }
        }
      }

      console.log('Total de colunas importadas:', importedColumns.length);
      console.log('Colunas importadas:', importedColumns);

      if (importedColumns.length === 0) {
        toast.error('Nenhuma coluna válida encontrada no CSV');
        return;
      }

      setFormData(prev => ({
        ...prev,
        columns: [...prev.columns, ...importedColumns]
      }));

      setCsvText('');
      setShowCsvImport(false);
      logEvent('csv_imported', 'load', { 
        columns_count: importedColumns.length,
        separator: separator 
      });
      toast.success(`${importedColumns.length} coluna(s) importada(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      logError(error as Error, 'csv_import_error');
      toast.error('Erro ao processar CSV. Verifique o formato.');
    }
  };

  const handleImportSql = () => {
    if (!sqlSelect.trim()) {
      toast.error('Cole a query SELECT para importar');
      return;
    }

    logClick('import_sql_button');
    try {
      const query = sqlSelect.trim();
      
      // Validar se é um SELECT
      if (!query.toUpperCase().includes('SELECT')) {
        toast.error('A query deve conter um SELECT');
        return;
      }

      // Extrair a parte SELECT até o FROM
      const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/is);
      if (!selectMatch) {
        toast.error('Formato de SELECT inválido. Use: SELECT col1, col2 AS alias FROM ...');
        return;
      }

      const selectClause = selectMatch[1];
      const importedColumns: ReportColumn[] = [];

      // Separar colunas (considerar vírgulas, mas não dentro de parênteses ou aspas)
      const columns = selectClause.split(',').map(col => col.trim());

      console.log('Colunas extraídas:', columns);

      for (const col of columns) {
        if (!col) continue;

        let columnName = '';
        let alias = '';
        
        // Verificar se tem AS (alias explícito)
        const asMatch = col.match(/(.+?)\s+AS\s+(.+)/i);
        if (asMatch) {
          columnName = asMatch[1].trim();
          alias = asMatch[2].trim();
        } else {
          // Verificar se tem alias sem AS (espaço simples)
          const parts = col.split(/\s+/);
          if (parts.length > 1 && !parts[1].match(/^(FROM|WHERE|GROUP|ORDER|LIMIT)/i)) {
            columnName = parts[0].trim();
            alias = parts[parts.length - 1].trim();
          } else {
            columnName = col.trim();
            alias = '';
          }
        }

        // Limpar pontos de tabela (ex: t.nome -> nome)
        if (columnName.includes('.')) {
          const dotParts = columnName.split('.');
          columnName = dotParts[dotParts.length - 1];
        }

        // Remover caracteres especiais e funções
        columnName = columnName.replace(/[`'"()]/g, '').trim();
        alias = alias.replace(/[`'"()]/g, '').trim();

        // Usar alias se existir, senão usar columnName
        const finalName = alias || columnName;

        // Pular se for * ou função agregada sem alias
        if (finalName === '*' || !finalName) continue;

        const column: ReportColumn = {
          id: uuidv4(),
          columnName: finalName,
          dataType: 'VARCHAR',
          orderDirection: 'ASC',
          description: alias ? `${columnName} (${alias})` : columnName,
          query: `SELECT ${col.trim()} FROM ...`
        };

        console.log('Coluna importada:', column);
        importedColumns.push(column);
      }

      console.log('Total de colunas importadas do SQL:', importedColumns.length);

      if (importedColumns.length === 0) {
        toast.error('Nenhuma coluna válida encontrada no SELECT');
        return;
      }

      setFormData(prev => ({
        ...prev,
        columns: [...prev.columns, ...importedColumns],
        query: query
      }));

      setSqlSelect('');
      setShowSqlImport(false);
      logEvent('sql_imported', 'load', { 
        columns_count: importedColumns.length
      });
      toast.success(`${importedColumns.length} coluna(s) importada(s) do SELECT`);
    } catch (error) {
      console.error('Erro ao importar SELECT:', error);
      logError(error as Error, 'sql_import_error');
      toast.error('Erro ao processar SELECT. Verifique o formato.');
    }
  };

  const handleSubmit = () => {
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    logClick('wizard_submit', { 
      report_id: formData.id,
      columns_count: formData.columns.length,
      status: formData.status 
    });
    onSave(formData);
    logEvent('report_wizard_completed', 'navigation', { 
      report_id: formData.id,
      is_new: !formData.id 
    });
  };

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Nome, descrição e status' },
    { number: 2, title: 'Colunas', description: 'Definição de colunas do relatório' },
    { number: 3, title: 'Query e Revisão', description: 'Query SQL e revisão final' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {report ? 'Editar Relatório' : 'Novo Relatório'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Passo {currentStep} de {steps.length}: {steps[currentStep - 1].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.number
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-2 text-center max-w-[100px]">
                  {step.title}
                </span>
              </div>
              {step.number < steps.length && (
                <div className="w-16 h-0.5 bg-muted mx-2 mt-[-20px]" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Informações Básicas */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do relatório"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Especificacao">Especificação</SelectItem>
                      <SelectItem value="Aceito">Aceito</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                      <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                      <SelectItem value="Substituido">Substituído</SelectItem>
                      <SelectItem value="Producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do relatório"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Filtros</Label>
                  <Textarea
                    value={formData.filtros}
                    onChange={(e) => setFormData({ ...formData, filtros: e.target.value })}
                    placeholder="Filtros aplicados no relatório"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agrupamentos</Label>
                  <Textarea
                    value={formData.agrupamentos}
                    onChange={(e) => setFormData({ ...formData, agrupamentos: e.target.value })}
                    placeholder="Agrupamentos utilizados"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Colunas */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adicionar Coluna</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSqlImport(!showSqlImport);
                        if (!showSqlImport) setShowCsvImport(false);
                      }}
                    >
                      <FileArrowDown className="mr-2" />
                      {showSqlImport ? 'Fechar' : 'Importar SELECT'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCsvImport(!showCsvImport);
                        if (!showCsvImport) setShowSqlImport(false);
                      }}
                    >
                      <FileArrowDown className="mr-2" />
                      {showCsvImport ? 'Fechar' : 'Importar CSV'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showSqlImport && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <Label className="mb-2 block font-semibold">Cole sua query SELECT aqui</Label>
                    <Textarea
                      value={sqlSelect}
                      onChange={(e) => setSqlSelect(e.target.value)}
                      placeholder="SELECT id, nome, email AS contato, status FROM usuarios WHERE ativo = 1"
                      rows={6}
                      className="font-mono text-xs mb-2"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleImportSql} size="sm">
                        Importar Colunas do SELECT
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSqlSelect('');
                          setShowSqlImport(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p><strong>Como funciona:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Extrai colunas e aliases da cláusula SELECT</li>
                        <li>Nome: usa alias se existir, senão usa nome da coluna</li>
                        <li>Descrição: gerada automaticamente</li>
                        <li>Tipo: padrão VARCHAR (você pode editar depois)</li>
                        <li>Ordenação: padrão ASC</li>
                        <li>Query: arquivada automaticamente para cada campo</li>
                      </ul>
                      <p className="mt-2"><strong>Exemplo:</strong> SELECT id, nome, email AS contato FROM usuarios</p>
                      <p>Resultado: colunas "id", "nome" e "contato"</p>
                    </div>
                  </div>
                )}
                {showCsvImport && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <Label className="mb-2 block font-semibold">Cole o texto CSV aqui</Label>
                    <Textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="column_name,data_type,order_direction,description,query&#10;id,VARCHAR,ASC,Identificador único,SELECT id FROM tabela&#10;nome,VARCHAR,ASC,Nome do registro,SELECT nome FROM tabela&#10;status,VARCHAR,DESC,Status atual,SELECT status FROM tabela"
                      rows={6}
                      className="font-mono text-xs mb-2"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleImportCsv} size="sm">
                        Importar Colunas
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setCsvText('');
                          setShowCsvImport(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Formato:</strong> column_name,data_type,order_direction,description,query
                      <br />
                      Separador: vírgula (,) ou ponto-e-vírgula (;)
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Nome da Coluna *</Label>
                    <Input
                      value={newColumn.columnName}
                      onChange={(e) => setNewColumn({ ...newColumn, columnName: e.target.value })}
                      placeholder="nome_coluna"
                      maxLength={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Dado</Label>
                    <Select
                      value={newColumn.dataType}
                      onValueChange={(value) => setNewColumn({ ...newColumn, dataType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ordenação</Label>
                    <Select
                      value={newColumn.orderDirection}
                      onValueChange={(value: any) => setNewColumn({ ...newColumn, orderDirection: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Ascendente</SelectItem>
                        <SelectItem value="DESC">Descendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={newColumn.description}
                      onChange={(e) => setNewColumn({ ...newColumn, description: e.target.value })}
                      placeholder="Descrição"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Query</Label>
                    <Input
                      value={newColumn.query}
                      onChange={(e) => setNewColumn({ ...newColumn, query: e.target.value })}
                      placeholder="SELECT ..."
                    />
                  </div>
                </div>
                <Button onClick={handleAddColumn}>
                  <Plus className="mr-2" />
                  Adicionar Coluna
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colunas Definidas ({formData.columns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.columns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma coluna adicionada ainda
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ordenação</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.columns.map((col, index) => (
                        <TableRow key={col.id || index}>
                          <TableCell className="font-mono">{col.columnName}</TableCell>
                          <TableCell>{col.dataType}</TableCell>
                          <TableCell>{col.orderDirection}</TableCell>
                          <TableCell className="max-w-xs truncate">{col.description}</TableCell>
                          <TableCell className="max-w-xs truncate font-mono text-xs">
                            {col.query}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColumn(index)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Query e Revisão */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Query SQL e Revisão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Query SQL do Relatório</Label>
                <Textarea
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="SELECT * FROM ..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Resumo do Relatório</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {formData.nome || 'Não definido'}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                  <p><strong>Colunas:</strong> {formData.columns.length}</p>
                  <p><strong>Descrição:</strong> {formData.descricao || 'Não definida'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Salvar Relatório
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
