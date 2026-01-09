/**
 * Middleware de logging de requisições
 */
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // Log da requisição
  console.log(`
📨 ${req.method} ${req.path}
   Query: ${JSON.stringify(req.query)}
   Body: ${req.method !== 'GET' ? JSON.stringify(req.body) : 'N/A'}
   IP: ${req.ip}
   User-Agent: ${req.get('user-agent')}
  `);

  // Interceptar o final da resposta para logar
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    console.log(`
✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)
  `);
    originalSend.call(this, data);
  };

  next();
};

export default logRequest;
