import { useEffect, useCallback, useRef } from 'react';
import { loggingService } from '@/lib/logging-service';
import { LogAttributes, EventType } from '@/lib/logging-types';

export function useLogging(screenName: string) {
  const screenNameRef = useRef<string>(screenName);
  const mountTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    screenNameRef.current = screenName;
  }, [screenName]);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    loggingService.logNavigation(screenName, {
      mount_time: new Date().toISOString()
    });

    loggingService.logEvent({
      screen_name: screenName,
      event_name: 'screen_load',
      event_type: 'load',
      severity: 'info',
      attributes: {
        screen_name: screenName
      }
    });

    return () => {
      const duration = mountTimeRef.current 
        ? Date.now() - mountTimeRef.current 
        : 0;
        
      loggingService.logEvent({
        screen_name: screenNameRef.current,
        event_name: 'screen_unload',
        event_type: 'navigation',
        severity: 'info',
        attributes: {
          screen_duration_ms: duration
        }
      });
      
      loggingService.endSpan();
    };
  }, [screenName]);

  const logClick = useCallback((elementName: string, attributes?: LogAttributes) => {
    loggingService.logClick(screenNameRef.current, elementName, attributes);
  }, []);

  const logInput = useCallback((fieldName: string, attributes?: LogAttributes) => {
    loggingService.logInput(screenNameRef.current, fieldName, attributes);
  }, []);

  const logEvent = useCallback((eventName: string, eventType: EventType, attributes?: LogAttributes) => {
    loggingService.logEvent({
      screen_name: screenNameRef.current,
      event_name: eventName,
      event_type: eventType,
      severity: 'info',
      attributes
    });
  }, []);

  const logError = useCallback((error: Error, attributes?: LogAttributes) => {
    loggingService.logError(error, {
      screen_name: screenNameRef.current,
      event_name: 'error',
      attributes
    });
  }, []);

  const logScreenView = useCallback((attributes?: LogAttributes) => {
    loggingService.logEvent({
      screen_name: screenNameRef.current,
      event_name: 'screen_view',
      event_type: 'navigation',
      severity: 'info',
      attributes
    });
  }, []);

  return {
    logClick,
    logInput,
    logEvent,
    logError,
    logScreenView,
    screenName: screenNameRef.current
  };
}

export function useAPILogging() {
  const logAPICall = useCallback(async (
    method: string,
    route: string,
    payload?: LogAttributes,
    attributes?: LogAttributes
  ) => {
    return await loggingService.logAPICall({
      method,
      route,
      payload,
      attributes
    });
  }, []);

  const logAPIResponse = useCallback(async (
    requestId: string,
    statusCode: number,
    durationMs: number,
    attributes?: LogAttributes
  ) => {
    await loggingService.logAPIResponse({
      request_id: requestId,
      status_code: statusCode,
      duration_ms: durationMs,
      attributes
    });
  }, []);

  return {
    logAPICall,
    logAPIResponse
  };
}
