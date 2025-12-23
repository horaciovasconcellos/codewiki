import { ulid } from 'ulid';
import { FrontendLogEvent, APILogEvent, EventType, LogSeverity, LogAttributes } from './logging-types';

class LoggingService {
  private sessionId: string;
  private currentTraceId: string;
  private currentSpanId: string;
  private spanStack: Array<{ spanId: string; parentSpanId?: string }> = [];
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.currentTraceId = ulid();
    this.currentSpanId = ulid();
    this.checkAndCleanStorage(); // Verifica e limpa storage na inicialização
  }

  private checkAndCleanStorage(): void {
    try {
      const STORAGE_KEY = 'system_logs';
      const MAX_LOGS = 500;
      
      const logsString = localStorage.getItem(STORAGE_KEY);
      if (logsString) {
        const logs = JSON.parse(logsString);
        if (logs.length > MAX_LOGS) {
          const cleanedLogs = logs.slice(-MAX_LOGS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLogs));
          console.log(`Cleaned ${logs.length - MAX_LOGS} old logs on initialization`);
        }
      }
    } catch (error) {
      console.warn('Failed to check storage, clearing all logs:', error);
      localStorage.removeItem('system_logs');
    }
  }

  clearAllLogs(): void {
    try {
      localStorage.removeItem('system_logs');
      console.log('All logs cleared successfully');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  private getOrCreateSessionId(): string {
    const sessionKey = 'logging_session_id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = ulid();
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  generateTraceId(): string {
    return ulid();
  }

  generateSpanId(): string {
    return ulid();
  }

  startTrace(traceName?: string): string {
    this.currentTraceId = this.generateTraceId();
    this.currentSpanId = this.generateSpanId();
    this.spanStack = [{ spanId: this.currentSpanId }];
    
    if (traceName) {
      this.logEvent({
        screen_name: 'system',
        event_name: `trace_start_${traceName}`,
        event_type: 'navigation',
        severity: 'info',
        attributes: { trace_name: traceName }
      });
    }
    
    return this.currentTraceId;
  }

  startSpan(spanName: string, parentSpanId?: string): string {
    const newSpanId = this.generateSpanId();
    const parent = parentSpanId || this.currentSpanId;
    
    this.spanStack.push({ spanId: newSpanId, parentSpanId: parent });
    this.currentSpanId = newSpanId;
    
    this.logEvent({
      screen_name: 'system',
      event_name: `span_start_${spanName}`,
      event_type: 'navigation',
      severity: 'debug',
      attributes: { 
        span_name: spanName,
        parent_span_id: parent
      }
    });
    
    return newSpanId;
  }

  endSpan() {
    if (this.spanStack.length > 1) {
      const endedSpan = this.spanStack.pop();
      const currentSpan = this.spanStack[this.spanStack.length - 1];
      
      if (currentSpan) {
        this.currentSpanId = currentSpan.spanId;
      }
      
      this.logEvent({
        screen_name: 'system',
        event_name: 'span_end',
        event_type: 'navigation',
        severity: 'debug',
        attributes: { 
          ended_span_id: endedSpan?.spanId
        }
      });
    }
  }

  async logEvent(params: {
    screen_name: string;
    event_name: string;
    event_type: EventType;
    severity?: LogSeverity;
    attributes?: LogAttributes;
  }): Promise<void> {
    const user = await this.getCurrentUser();
    const currentSpan = this.spanStack[this.spanStack.length - 1];
    
    const logEvent: FrontendLogEvent = {
      id: ulid(),
      timestamp: new Date().toISOString(),
      user_id: user.id,
      screen_name: params.screen_name,
      event_name: params.event_name,
      event_type: params.event_type,
      trace_id: this.currentTraceId,
      span_id: this.currentSpanId,
      parent_span_id: currentSpan?.parentSpanId,
      session_id: this.sessionId,
      severity: params.severity || 'info',
      attributes: {
        ...params.attributes,
        user_login: user.login,
        user_email: user.email,
        url: window.location.href,
        user_agent: navigator.userAgent,
      }
    };

    await this.persistLog(logEvent);
    
    if (params.severity === 'error') {
      console.error('[LOG ERROR]', logEvent);
    } else if (import.meta.env.DEV) {
      console.log('[LOG]', logEvent);
    }
  }

  async logError(error: Error, context: {
    screen_name: string;
    event_name: string;
    attributes?: LogAttributes;
  }): Promise<void> {
    await this.logEvent({
      screen_name: context.screen_name,
      event_name: context.event_name,
      event_type: 'error',
      severity: 'error',
      attributes: {
        ...context.attributes,
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack || '',
      }
    });
  }

  async logNavigation(screenName: string, attributes?: LogAttributes): Promise<void> {
    this.startSpan(`navigation_${screenName}`);
    
    await this.logEvent({
      screen_name: screenName,
      event_name: 'screen_navigation',
      event_type: 'navigation',
      severity: 'info',
      attributes: {
        ...attributes,
        previous_screen: document.referrer || 'direct'
      }
    });
  }

  async logClick(screenName: string, elementName: string, attributes?: LogAttributes): Promise<void> {
    await this.logEvent({
      screen_name: screenName,
      event_name: `click_${elementName}`,
      event_type: 'click',
      severity: 'debug',
      attributes
    });
  }

  async logInput(screenName: string, fieldName: string, attributes?: LogAttributes): Promise<void> {
    await this.logEvent({
      screen_name: screenName,
      event_name: `input_${fieldName}`,
      event_type: 'input',
      severity: 'debug',
      attributes
    });
  }

  async logAPICall(params: {
    method: string;
    route: string;
    payload?: LogAttributes;
    attributes?: LogAttributes;
  }): Promise<string> {
    const requestId = ulid();
    const apiSpanId = this.startSpan(`api_${params.method}_${params.route}`);
    
    const apiLog: APILogEvent = {
      id: ulid(),
      timestamp: new Date().toISOString(),
      trace_id: this.currentTraceId,
      span_id: apiSpanId,
      parent_span_id: this.spanStack[this.spanStack.length - 2]?.spanId,
      request_id: requestId,
      method: params.method,
      route: params.route,
      payload: this.sanitizePayload(params.payload),
      severity: 'info',
      attributes: {
        ...params.attributes,
        w3c_traceparent: this.getW3CTraceparent()
      }
    };

    await this.persistLog(apiLog);
    
    return requestId;
  }

  async logAPIResponse(params: {
    request_id: string;
    status_code: number;
    duration_ms: number;
    attributes?: LogAttributes;
  }): Promise<void> {
    const severity: LogSeverity = params.status_code >= 500 ? 'error' 
      : params.status_code >= 400 ? 'warn' 
      : 'info';

    const apiLog: APILogEvent = {
      id: ulid(),
      timestamp: new Date().toISOString(),
      trace_id: this.currentTraceId,
      span_id: this.currentSpanId,
      request_id: params.request_id,
      method: '',
      route: '',
      status_code: params.status_code,
      duration_ms: params.duration_ms,
      severity,
      attributes: params.attributes || {}
    };

    await this.persistLog(apiLog);
    this.endSpan();
  }

  private sanitizePayload(payload?: LogAttributes): LogAttributes | undefined {
    if (!payload) return undefined;
    
    const sanitized = { ...payload };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'personalAccessToken'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private getW3CTraceparent(): string {
    return `00-${this.currentTraceId}-${this.currentSpanId}-01`;
  }

  private async getCurrentUser(): Promise<{ id: string; login: string; email: string }> {
    try {
      // Mock user - Spark removido
      return {
        id: 'system',
        login: 'sistema',
        email: 'sistema@local'
      };
    } catch {
      return {
        id: 'anonymous',
        login: 'anonymous',
        email: 'unknown'
      };
    }
  }

  private async persistLog(logEvent: FrontendLogEvent | APILogEvent): Promise<void> {
    try {
      const STORAGE_KEY = 'system_logs';
      const MAX_LOGS = 500; // Reduzido de 10000 para 500
      const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (localStorage tem limite de ~5-10MB)
      
      let logs: any[] = [];
      
      try {
        const logsString = localStorage.getItem(STORAGE_KEY);
        logs = logsString ? JSON.parse(logsString) : [];
      } catch (parseError) {
        // Se falhar ao parsear, limpa tudo
        console.warn('Failed to parse logs, clearing storage');
        localStorage.removeItem(STORAGE_KEY);
        logs = [];
      }
      
      // Adiciona novo log
      logs.push(logEvent);
      
      // Remove logs antigos se exceder o limite
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(-MAX_LOGS); // Mantém apenas os últimos MAX_LOGS
      }
      
      // Tenta salvar
      const logsString = JSON.stringify(logs);
      
      // Verifica o tamanho antes de salvar
      if (logsString.length > MAX_STORAGE_SIZE) {
        // Se muito grande, remove metade dos logs mais antigos
        logs = logs.slice(Math.floor(logs.length / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        console.warn(`Log storage exceeded ${MAX_STORAGE_SIZE} bytes, removed old logs`);
      } else {
        localStorage.setItem(STORAGE_KEY, logsString);
      }
      
    } catch (error: any) {
      // Trata especificamente o erro de quota
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('localStorage quota exceeded, clearing old logs');
        try {
          // Limpa todos os logs antigos
          localStorage.removeItem('system_logs');
          // Tenta salvar apenas o log atual
          localStorage.setItem('system_logs', JSON.stringify([logEvent]));
        } catch (clearError) {
          // Se ainda falhar, desiste silenciosamente
          console.error('Failed to clear logs:', clearError);
        }
      } else {
        console.error('Failed to persist log:', error);
      }
    }
  }

  getTraceContext(): { traceId: string; spanId: string; sessionId: string } {
    return {
      traceId: this.currentTraceId,
      spanId: this.currentSpanId,
      sessionId: this.sessionId
    };
  }
}

export const loggingService = new LoggingService();
