import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  PencilSimple, 
  Trash,
  CheckCircle,
  Circle
} from '@phosphor-icons/react';

interface Repositorio {
  id: string;
  nome: string;
  grupo: string;
  tipo: string;
  linguagem: string;
  display: string;
  criado?: boolean;
}

interface RepositoriosDataTableProps {
  repositorios: Repositorio[];
  onUpdateNome: (id: string, novoNome: string) => void;
  onDelete: (id: string) => void;
  projetoProcessado?: boolean;
}

export function RepositoriosDataTable({ repositorios, onUpdateNome, onDelete, projetoProcessado = false }: RepositoriosDataTableProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeTemp, setNomeTemp] = useState('');

  const handleStartEdit = (repo: Repositorio) => {
    if (repo.criado || projetoProcessado) return;
    setEditandoId(repo.id);
    setNomeTemp(repo.nome);
  };

  const handleSaveEdit = (id: string) => {
    if (nomeTemp.trim()) {
      onUpdateNome(id, nomeTemp.trim());
      setEditandoId(null);
      setNomeTemp('');
    }
  };

  const handleCancelEdit = () => {
    setEditandoId(null);
    setNomeTemp('');
  };

  if (repositorios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhum repositório adicionado ainda
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="min-w-[200px]">Nome do Repositório</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Linguagem</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repositorios.map((repo) => (
            <TableRow key={repo.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
              <TableCell>
                {repo.criado ? (
                  <CheckCircle size={20} className="text-green-600" weight="fill" />
                ) : (
                  <Circle size={20} className="text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                {editandoId === repo.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={nomeTemp}
                      onChange={(e) => setNomeTemp(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(repo.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(repo.id)}>
                      OK
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <span className="font-mono text-sm">{repo.nome}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{repo.grupo}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{repo.tipo}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{repo.linguagem}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(repo)}
                    disabled={repo.criado || projetoProcessado}
                    title={
                      projetoProcessado 
                        ? 'Projeto já processado - não é possível editar' 
                        : repo.criado 
                          ? 'Não é possível editar um repositório já criado' 
                          : 'Editar nome'
                    }
                  >
                    <PencilSimple size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={repo.criado || projetoProcessado}
                        title={
                          projetoProcessado
                            ? 'Projeto já processado - não é possível excluir'
                            : repo.criado 
                              ? 'Não é possível excluir um repositório já criado' 
                              : 'Excluir'
                        }
                      >
                        <Trash size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o repositório <strong>{repo.nome}</strong>?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(repo.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
