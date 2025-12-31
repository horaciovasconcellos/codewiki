import { useState, useRef } from 'react';
import { InnerSourceProject, InnerSourceOwner, InnerSourceMetadata } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FloppyDisk, X, Download, Image as ImageIcon, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface InnerSourceFormProps {
  project?: InnerSourceProject;
  onSave: (project: InnerSourceProject) => void;
  onCancel: () => void;
}

export function InnerSourceForm({ project, onSave, onCancel }: InnerSourceFormProps) {
  const [id] = useState(project?.id || `innersource-${Date.now()}`);
  const [nome, setNome] = useState(project?.nome || '');
  const [fullNome, setFullNome] = useState(project?.full_nome || '');
  const [htmlUrl, setHtmlUrl] = useState(project?.html_url || '');
  const [descricao, setDescricao] = useState(project?.descricao || '');
  const [stargazersCount, setStargazersCount] = useState(project?.stargazers_count || 0);
  const [watchersCount, setWatchersCount] = useState(project?.watchers_count || 0);
  const [language, setLanguage] = useState(project?.language || '');
  const [forksCount, setForksCount] = useState(project?.forks_count || 0);
  const [openIssuesCount, setOpenIssuesCount] = useState(project?.open_issues_count || 0);
  const [license, setLicense] = useState(project?.license || '');

  // Owner
  const [ownerLogin, setOwnerLogin] = useState(project?.owner.login || '');
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState(project?.owner.avatar_url || '');
  const [ownerHtmlUrl, setOwnerHtmlUrl] = useState(project?.owner.html_url || '');
  const [ownerType, setOwnerType] = useState(project?.owner.type || 'Organization');

  // Metadata
  const [logo, setLogo] = useState(project?._InnerSourceMetadata.logo || '');
  const [topics, setTopics] = useState<string[]>(project?._InnerSourceMetadata.topics || []);
  const [newTopic, setNewTopic] = useState('');
  const [contributorsCount, setContributorsCount] = useState(project?._InnerSourceMetadata.participation?.contributors_count || 0);
  const [commitsLastYear, setCommitsLastYear] = useState(project?._InnerSourceMetadata.participation?.commits_last_year || 0);
  const [pullRequestsCount, setPullRequestsCount] = useState(project?._InnerSourceMetadata.participation?.pull_requests_count || 0);
  const [descriptionExtended, setDescriptionExtended] = useState(project?._InnerSourceMetadata.description_extended || '');
  const [documentation, setDocumentation] = useState(project?._InnerSourceMetadata.documentation || '');
  const [contributionGuidelines, setContributionGuidelines] = useState(project?._InnerSourceMetadata.contribution_guidelines || '');
  const [maturity, setMaturity] = useState<'emerging' | 'growing' | 'mature' | 'graduated'>(project?._InnerSourceMetadata.maturity || 'emerging');
  const [contact, setContact] = useState(project?._InnerSourceMetadata.contact || '');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOwnerAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) {
      toast.error('Digite um tópico antes de adicionar');
      return;
    }
    if (topics.includes(newTopic.trim())) {
      toast.error('Este tópico já foi adicionado');
      return;
    }
    setTopics([...topics, newTopic.trim()]);
    setNewTopic('');
    toast.success('Tópico adicionado');
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
    toast.success('Tópico removido');
  };

  const handleFetchFromRepo = async () => {
    if (!htmlUrl.trim()) {
      toast.error('Informe a URL do repositório');
      return;
    }

    setIsFetching(true);
    try {
      // Extrair owner e repo da URL
      const match = htmlUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        toast.error('URL inválida do GitHub');
        return;
      }

      const [, owner, repo] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        toast.error('Erro ao buscar dados do repositório');
        return;
      }

      const data = await response.json();

      // Preencher campos básicos
      setNome(data.name || nome);
      setFullNome(data.full_name || fullNome);
      setDescricao(data.description || descricao);
      setStargazersCount(data.stargazers_count || 0);
      setWatchersCount(data.watchers_count || 0);
      setLanguage(data.language || language);
      setForksCount(data.forks_count || 0);
      setOpenIssuesCount(data.open_issues_count || 0);
      setLicense(data.license?.spdx_id || license);

      // Preencher owner
      if (data.owner) {
        setOwnerLogin(data.owner.login || ownerLogin);
        setOwnerAvatarUrl(data.owner.avatar_url || ownerAvatarUrl);
        setOwnerHtmlUrl(data.owner.html_url || ownerHtmlUrl);
        setOwnerType(data.owner.type || ownerType);
      }

      // Preencher topics
      if (data.topics && data.topics.length > 0) {
        setTopics(data.topics);
      }

      toast.success('Dados carregados do repositório com sucesso');
    } catch (error) {
      console.error('Erro ao buscar repositório:', error);
      toast.error('Erro ao buscar dados do repositório');
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = (): boolean => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!fullNome.trim()) {
      toast.error('Nome completo é obrigatório');
      return false;
    }
    if (!htmlUrl.trim()) {
      toast.error('URL do repositório é obrigatória');
      return false;
    }
    if (!ownerLogin.trim()) {
      toast.error('Owner login é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const owner: InnerSourceOwner = {
      login: ownerLogin,
      avatar_url: ownerAvatarUrl,
      html_url: ownerHtmlUrl,
      type: ownerType,
    };

    const metadata: InnerSourceMetadata = {
      logo,
      topics,
      participation: {
        contributors_count: contributorsCount,
        commits_last_year: commitsLastYear,
        pull_requests_count: pullRequestsCount,
      },
      description_extended: descriptionExtended,
      documentation,
      contribution_guidelines: contributionGuidelines,
      maturity,
      contact,
      last_sync: new Date().toISOString(),
    };

    const newProject: InnerSourceProject = {
      id,
      nome,
      full_nome: fullNome,
      html_url: htmlUrl,
      descricao,
      stargazers_count: stargazersCount,
      watchers_count: watchersCount,
      language,
      forks_count: forksCount,
      open_issues_count: openIssuesCount,
      license,
      owner,
      _InnerSourceMetadata: metadata,
    };

    onSave(newProject);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project ? 'Editar Projeto InnerSource' : 'Novo Projeto InnerSource'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="nome-repositorio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullNome">Nome Completo *</Label>
                <Input
                  id="fullNome"
                  value={fullNome}
                  onChange={(e) => setFullNome(e.target.value)}
                  placeholder="organizacao/nome-repositorio"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="htmlUrl">URL do Repositório *</Label>
              <div className="flex gap-2">
                <Input
                  id="htmlUrl"
                  value={htmlUrl}
                  onChange={(e) => setHtmlUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleFetchFromRepo}
                  disabled={isFetching}
                  variant="outline"
                >
                  <Download className="mr-2" size={16} />
                  {isFetching ? 'Buscando...' : 'Buscar Dados'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em "Buscar Dados" para carregar automaticamente as informações do repositório
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição curta do projeto"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Linguagem Principal</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="JavaScript, Python, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">Licença</Label>
                <Input
                  id="license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="MIT, Apache-2.0, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maturity">Maturidade</Label>
                <Select value={maturity} onValueChange={(v: any) => setMaturity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging">Emerging</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="mature">Mature</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Estatísticas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estatísticas</h3>
            
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stars">Estrelas</Label>
                <Input
                  id="stars"
                  type="number"
                  value={stargazersCount}
                  onChange={(e) => setStargazersCount(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="watchers">Observadores</Label>
                <Input
                  id="watchers"
                  type="number"
                  value={watchersCount}
                  onChange={(e) => setWatchersCount(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forks">Forks</Label>
                <Input
                  id="forks"
                  type="number"
                  value={forksCount}
                  onChange={(e) => setForksCount(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">Issues Abertas</Label>
                <Input
                  id="issues"
                  type="number"
                  value={openIssuesCount}
                  onChange={(e) => setOpenIssuesCount(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributors">Contribuidores</Label>
                <Input
                  id="contributors"
                  type="number"
                  value={contributorsCount}
                  onChange={(e) => setContributorsCount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commits">Commits (Último Ano)</Label>
                <Input
                  id="commits"
                  type="number"
                  value={commitsLastYear}
                  onChange={(e) => setCommitsLastYear(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prs">Pull Requests</Label>
                <Input
                  id="prs"
                  type="number"
                  value={pullRequestsCount}
                  onChange={(e) => setPullRequestsCount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Owner */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Proprietário</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerLogin">Login *</Label>
                <Input
                  id="ownerLogin"
                  value={ownerLogin}
                  onChange={(e) => setOwnerLogin(e.target.value)}
                  placeholder="organizacao"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerType">Tipo</Label>
                <Select value={ownerType} onValueChange={setOwnerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Organization">Organization</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerHtmlUrl">URL do Proprietário</Label>
              <Input
                id="ownerHtmlUrl"
                value={ownerHtmlUrl}
                onChange={(e) => setOwnerHtmlUrl(e.target.value)}
                placeholder="https://github.com/organizacao"
              />
            </div>

            <div className="space-y-2">
              <Label>Avatar do Proprietário</Label>
              <div className="flex items-center gap-4">
                {ownerAvatarUrl && (
                  <div className="relative">
                    <img src={ownerAvatarUrl} alt="Avatar" className="w-16 h-16 rounded-full" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setOwnerAvatarUrl('')}
                    >
                      <Trash size={12} />
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2" size={16} />
                  {ownerAvatarUrl ? 'Trocar Avatar' : 'Adicionar Avatar'}
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadados InnerSource */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadados InnerSource</h3>
            
            <div className="space-y-2">
              <Label>Logo do Projeto</Label>
              <div className="flex items-center gap-4">
                {logo && (
                  <div className="relative">
                    <img src={logo} alt="Logo" className="w-16 h-16 object-contain rounded border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setLogo('')}
                    >
                      <Trash size={12} />
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2" size={16} />
                  {logo ? 'Trocar Logo' : 'Adicionar Logo'}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tópicos (Topics)</Label>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ex: javascript, react, nodejs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTopic} variant="outline">
                  Adicionar
                </Button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="cursor-pointer">
                      {topic}
                      <X
                        size={14}
                        className="ml-1"
                        onClick={() => handleRemoveTopic(topic)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionExtended">Descrição Estendida</Label>
              <Textarea
                id="descriptionExtended"
                value={descriptionExtended}
                onChange={(e) => setDescriptionExtended(e.target.value)}
                placeholder="Descrição detalhada do projeto"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentation">Documentação (URL)</Label>
                <Input
                  id="documentation"
                  value={documentation}
                  onChange={(e) => setDocumentation(e.target.value)}
                  placeholder="https://docs.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributionGuidelines">Guia de Contribuição (URL)</Label>
                <Input
                  id="contributionGuidelines"
                  value={contributionGuidelines}
                  onChange={(e) => setContributionGuidelines(e.target.value)}
                  placeholder="https://github.com/org/repo/CONTRIBUTING.md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contato (Canal do Time)</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Slack, Teams, Email, etc."
              />
            </div>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2" size={16} />
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit}>
              <FloppyDisk className="mr-2" size={16} />
              Salvar Projeto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
