import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import BaseGateway from './BaseGateway';
import * as URL from 'url';
import { WebServiceStatus, BlockchainPlatform } from './enums';
import { getLogger } from '../src/Logger';
import { ICurrency } from './interfaces';
import { CurrencyRegistry, GatewayRegistry } from './registries';

const logger = getLogger('BaseWebServer');

export abstract class BaseWebServer {
  protected protocol: string;
  protected host: string;
  protected port: number;
  protected app: express.Express = express();
  protected readonly _currency: ICurrency;

  public constructor(platform: BlockchainPlatform) {
    this._currency = CurrencyRegistry.getOneNativeCurrency(platform);
    this._parseConfig(platform);
    this.setup();
    this.finishSetup();
  }

  protected _parseConfig(platform: BlockchainPlatform) {
    const config = CurrencyRegistry.getCurrencyConfig(this._currency);
    if (!config) {
      throw new Error(`Cannot find configuration for ${this._currency.symbol} at config table`);
    }

    const internalEndpoint = URL.parse(`${config.internalEndpoint}`);
    if (!internalEndpoint.protocol || !internalEndpoint.hostname || !internalEndpoint.port) {
      logger.error(`Api endpoint for ${this._currency.symbol} have incorrect format`, {
        url: config.internalEndpoint,
      });
      throw new Error(`Api endpoint for ${this._currency.symbol} have incorrect format`);
    }

    this.protocol = internalEndpoint.protocol;
    this.host = internalEndpoint.hostname;
    this.port = parseInt(internalEndpoint.port, 10);
  }

  public start() {
    this.app.listen(this.port, this.host, () => {
      logger.info(`Server started at ${this.protocol}://${this.host}:${this.port}`);
    });
  }

  public getGateway(symbol: string): BaseGateway {
    const currency = CurrencyRegistry.getOneCurrency(symbol);
    return GatewayRegistry.getGatewayInstance(currency);
  }

  protected async checkHealth() {
    return { status: await this._getHealthStatus() };
  }

  protected async _getHealthStatus(): Promise<WebServiceStatus> {
    return WebServiceStatus.OK;
  }

  protected setup() {
    this.app.use(morgan('dev'));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Log request and response
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      const originalEnd = res.end;
      const originalWrite = res.write;
      const originalJson = res.json;
      let responseBodyString: string = null;
      let responseBodyJson = null;
      const chunks = [];

      res.write = function (chunk): boolean {
        chunks.push(new Buffer(chunk));
        return originalWrite.apply(res, arguments);
      };

      res.json = function (bodyJson) {
        responseBodyJson = bodyJson;
        return originalJson.apply(res, arguments);
      };

      res.end = function (chunk) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }

        responseBodyString = Buffer.concat(chunks).toString('utf8');
        logRequest(req, res, timestamp, responseBodyString, responseBodyJson);
        return originalEnd.apply(res, arguments);
      };

      next();
    });

    this.app.use((err, req, res, next) => {
      if (res.headersSent) {
        return next(err);
      }

      res.status(500);
      res.render('error', { error: err });
    });

    this.app.get('/api/health', async (req, res) => {
      res.status(200).json(await this.checkHealth());
    });
  }

  private finishSetup() {
    this.app.use(function (req, res) {
      res.status(404).json({ error: 'API Not Found' });
    });
  }

  public getProtocol(): string {
    return this.protocol;
  }

  public getHost(): string {
    return this.host;
  }

  public getPort(): number {
    return this.port;
  }
}

function logRequest(
  req: express.Request,
  res: express.Response,
  requestTimestamp: string,
  responseBodyString: string,
  responseBodyJson: any,
) {
  const request = {
    timestamp: requestTimestamp,
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    hostname: req.hostname,
    ip: req.ip,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: req.headers,
  };
  const response = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    responseBodyString: hidePrivateKey(responseBodyString),
    responseBodyJson: hidePrivateKey(responseBodyJson),
  };
  logger.info(`${req.method} ${req.originalUrl}`, { request, response });
}

function hidePrivateKey(response: any) {
  if (typeof response === 'string') {
    const responseBodyJson = JSON.parse(response);
    if (responseBodyJson.hasOwnProperty('private_key')) {
      responseBodyJson.private_key = '***';
    }
    if (responseBodyJson.hasOwnProperty('privateKey')) {
      responseBodyJson.privateKey = '***';
    }
    return JSON.stringify(responseBodyJson);
  } else {
    if (response.hasOwnProperty('private_key')) {
      response.private_key = '***';
    }
    if (response.hasOwnProperty('privateKey')) {
      response.privateKey = '***';
    }
    return response;
  }
}
