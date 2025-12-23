export function DebugApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ color: 'green' }}>✓ React está funcionando!</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <hr />
      <h2>Testes:</h2>
      <ul>
        <li>✓ React renderizou</li>
        <li>✓ JSX processado</li>
        <li>✓ TypeScript compilado</li>
      </ul>
    </div>
  );
}
