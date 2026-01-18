-- Inserir permissões para admin (todas as permissões)
INSERT INTO permissoes_usuario (usuario_id, tela, create_permission, read_permission, update_permission, delete_permission) VALUES
('092f69df-f3d9-11f0-be04-fe33497c9fa0', 'documentacao-projetos', 1, 1, 1, 1),
('092f69df-f3d9-11f0-be04-fe33497c9fa0', 'aplicacoes', 1, 1, 1, 1),
('092f69df-f3d9-11f0-be04-fe33497c9fa0', 'colaboradores', 1, 1, 1, 1),
('092f69df-f3d9-11f0-be04-fe33497c9fa0', 'usuarios', 1, 1, 1, 1),
-- Permissões para teste@gmail.com (somente leitura)
('45154b55-dd9d-40ab-a593-7a844467fad7', 'documentacao-projetos', 0, 1, 0, 0),
('45154b55-dd9d-40ab-a593-7a844467fad7', 'aplicacoes', 0, 1, 0, 0),
('45154b55-dd9d-40ab-a593-7a844467fad7', 'colaboradores', 0, 1, 0, 0),
('45154b55-dd9d-40ab-a593-7a844467fad7', 'usuarios', 0, 1, 0, 0)
ON DUPLICATE KEY UPDATE
  create_permission = VALUES(create_permission),
  read_permission = VALUES(read_permission),
  update_permission = VALUES(update_permission),
  delete_permission = VALUES(delete_permission);
