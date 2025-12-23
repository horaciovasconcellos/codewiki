-- Adicionar novos campos na tabela integracoes
ALTER TABLE integracoes
ADD COLUMN estilo_integracao ENUM(
    'Integração de processos',
    'Integração de dados',
    'Integração de análises',
    'Integração do usuário',
    'Integração de dispositivos'
) NULL AFTER nome,
ADD COLUMN padrao_caso_uso ENUM(
    'IA2A – Application-to-Application',
    'A2B – Application-to-Business',
    'B2B – Business-to-Business',
    'B2C – Business-to-Consumer',
    'C2B – Consumer-to-Business',
    'C2C – Consumer-to-Consumer',
    'T2T – Thing-to-Thing (IoT)',
    'T2C – Thing-to-Cloud',
    'T2A – Thing-to-Application',
    'Virtualização de dados',
    'Orquestração de dados',
    'extração, transformação e carregamento (ETL)',
    'Análises incorporadas',
    'Análise entre aplicações',
    'integração de interface do usuário',
    'Integração móvel',
    'Integração de chatbot',
    'Thing to analytics',
    'Thing to process',
    'Thing to data lake'
) NULL AFTER estilo_integracao,
ADD COLUMN integracao_tecnologica ENUM(
    'APIs (Application Programming Interfaces)',
    'Message Brokers',
    'ESB / iPaaS',
    'Tecnologias de EDI',
    'Integração por Arquivos',
    'Integração via Banco de Dados',
    'ETL/ELT e Data Integration',
    'Integração por Microservices',
    'IoT (Thing Integration)',
    'API Gateway / Gestão de APIs'
) NULL AFTER padrao_caso_uso;
