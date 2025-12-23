import mysql from 'mysql2/promise';

async function consultarProjetoAzure() {
  try {
    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'auditoria_user',
      password: 'auditoria_password',
      database: 'auditoria_system'
    });

    // Buscar configuração
    const [rows] = await connection.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'integration-config' LIMIT 1"
    );

    if (rows.length === 0) {
      console.log('Configuração não encontrada');
      return;
    }

    const config = JSON.parse(rows[0].valor);
    const orgUrl = config.azureDevOps.urlOrganizacao;
    const pat = config.azureDevOps.personalAccessToken;
    const organization = orgUrl.match(/dev\.azure\.com\/([^\/]+)/)[1];

    console.log('='.repeat(60));
    console.log('CONSULTANDO PROJETO TESTE003');
    console.log('='.repeat(60));

    // Consultar Team Settings
    const projectName = 'TESTE003';
    const teamName = 'Time - TESTE003';
    
    const url = `https://dev.azure.com/${organization}/${projectName}/${teamName}/_apis/work/teamsettings?api-version=7.1`;
    
    console.log(`\nURL: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro:', response.status, error);
      return;
    }

    const teamSettings = await response.json();
    
    console.log('TEAM SETTINGS:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(teamSettings, null, 2));
    console.log('='.repeat(60));
    
    console.log('\n📋 RESUMO:');
    console.log(`  Default Area: ${teamSettings.defaultAreaPath || 'N/A'}`);
    console.log(`  Default Iteration: ${teamSettings.defaultIteration?.name || teamSettings.defaultIteration || 'N/A'}`);
    console.log(`  Default Iteration Macro: ${teamSettings.defaultIterationMacro || 'N/A'}`);
    console.log(`  Backlog Iteration: ${teamSettings.backlogIteration?.name || 'N/A'}`);
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

consultarProjetoAzure();
