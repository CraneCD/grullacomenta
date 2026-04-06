import fs from 'fs';
import path from 'path';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

// Logger configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Format log entry
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, error } = entry;
  
  let logLine = `[${timestamp}] [${level}] ${message}`;
  
  if (context) {
    logLine += ` ${JSON.stringify(context)}`;
  }
  
  if (error) {
    logLine += `\nError: ${error.message}\nStack: ${error.stack}`;
  }
  
  return logLine + '\n';
}

// Write log to file
function writeLog(entry: LogEntry, file: string): void {
  const logLine = formatLogEntry(entry);
  
  fs.appendFileSync(file, logLine);
  
  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(logLine);
  }
}

// Logger class
export class Logger {
  private static instance: Logger;
  
  private constructor() {}
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  public info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
  
  public critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };
    
    // Write to main log file
    writeLog(entry, LOG_FILE);
    
    // Write errors to error log file
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      writeLog(entry, ERROR_LOG_FILE);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 