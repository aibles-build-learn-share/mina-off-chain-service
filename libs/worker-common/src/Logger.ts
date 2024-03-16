import _ from 'lodash';
import winston from 'winston';
import Transport from 'winston-transport';
import util from 'util';
import os from 'os';
import WinstonCloudWatch from 'winston-cloudwatch';

const { combine, timestamp, colorize, printf } = winston.format;
const randomSuffix = Math.random().toString(36).substr(2, 5);

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    const output = Object.assign(
      {
        message: info.message,
        stack: info.stack,
      },
      info,
    );

    return output;
  }

  return info;
});

export function safeToString(json: any): string {
  if (isEmpty(json)) {
    return null;
  }

  try {
    return JSON.stringify(json);
  } catch (ex) {
    return util.inspect(json);
  }
}

export function isEmpty(obj: any): boolean {
  // null and undefined are "empty"
  if (obj == null) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0) return false;
  if (obj.length === 0) return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== 'object') return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

export function getLogger(name: string): winston.Logger {
  const isLoggerExisted = winston.loggers.has(name);
  if (!isLoggerExisted) {
    createLogger(name);
  }

  return winston.loggers.get(name);
}

function createLogger(name: string) {
  const transports: Transport[] = [];

  // Console is default logger
  const consoleTransport = _createConsoleTransport();
  transports.push(consoleTransport);

  // If CloudWatch log is enabled, add them to transports list
  if (process.env.CWL_ENABLED === 'true') {
    const cwlTransport = _createCwlTransport();
    transports.push(cwlTransport);
  }

  winston.loggers.add(name, {
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(timestamp(), enumerateErrorFormat()),
    transports,
  });
}

function _createConsoleTransport(): Transport {
  return new winston.transports.Console({
    format: combine(
      colorize(),
      printf((info) => {
        const { timestamp, level, message, ...extra } = info;
        return (
          `${timestamp} [${level}]: ${message}` +
          (isEmpty(extra) ? '' : ` | ${safeToString(extra)}`)
        );
      }),
    ),
    stderrLevels: ['error'],
  });
}

function _createCwlTransport(): Transport {
  const logGroupName = process.env.CWL_LOG_GROUP_NAME || 'xxxxxx-scc-common';
  const logStreamPrefix = process.env.CWL_LOG_STREAM_PREFIX || os.hostname();
  const createdDate = new Date().toISOString().split('T')[0];
  const logStreamName = `${logStreamPrefix}-${createdDate}-${randomSuffix}`;
  const uploadRate = process.env.CWL_UPLOAD_RATE
    ? parseInt(process.env.CWL_UPLOAD_RATE, 10)
    : undefined;

  return new WinstonCloudWatch({
    level: process.env.CWL_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
    logGroupName,
    logStreamName,
    jsonMessage: false,
    uploadRate,
    awsAccessKeyId: process.env.CWL_AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.CWL_AWS_ACCESS_KEY_SECRET,
    awsRegion: process.env.CWL_AWS_REGION_ID,
    messageFormatter: function (log: winston.LogEntry): string {
      const { timestamp, level, message, ...meta } = log;
      return safeToString({ timestamp, level, message, meta });
    },
  });
}
