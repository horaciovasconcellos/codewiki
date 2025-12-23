export type EventType = 'click' | 'navigation' | 'load' | 'error' | 'input' | 'api_call' | 'api_response';

export type LogSeverity = 'debug' | 'info' | 'warn' | 'error';

export interface LogAttributes {
  [key: string]: string | number | boolean | null | undefined;
}

export interface FrontendLogEvent {
  id: string;
  timestamp: string;
  user_id: string;
  screen_name: string;
  event_name: string;
  event_type: EventType;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  session_id: string;
  severity: LogSeverity;
  attributes: LogAttributes;
}

export interface APILogEvent {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  request_id: string;
  method: string;
  route: string;
  status_code?: number;
  payload?: LogAttributes;
  duration_ms?: number;
  user_id?: string;
  severity: LogSeverity;
  error_message?: string;
  stack_trace?: string;
  attributes: LogAttributes;
}

export type LogEvent = FrontendLogEvent | APILogEvent;

export interface LogFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  screenName?: string;
  eventType?: EventType;
  statusCode?: number;
  traceId?: string;
  severity?: LogSeverity;
  searchText?: string;
}

export interface TraceSpan {
  span_id: string;
  parent_span_id?: string;
  name: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  attributes: LogAttributes;
  events: LogEvent[];
}

export interface Trace {
  trace_id: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  root_span: TraceSpan;
  spans: TraceSpan[];
  total_events: number;
}
