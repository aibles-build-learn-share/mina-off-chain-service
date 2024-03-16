import Axios, { AxiosRequestConfig } from 'axios';
interface IRpcResponseEnvelop<T> {
  jsonrpc: string;
  id: number | string;
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

interface IRpcRequest {
  API_key: string;
  jsonrpc: '2.0' | '1.0';
  id: number | string;
  method: string;
  params: any[];
}

interface IRpcConfig {
  protocol: string;
  rpchost: string;
  bookhost: string;
  port: string;
  apikey: string;
}

export class RPCClient {
  protected _config: IRpcConfig;

  constructor(config: IRpcConfig) {
    this._config = config;
  }

  /**
   * JSON-RPC call func
   * @param method RPC Request Method
   * @param params RPC Request Params
   * @param id RPC Request id
   * @return RPCResponse<T>
   * @throws Response non-2xx response or request error
   */
  public async post<T>(method: string, params?: any[], id?: number | string): Promise<T> {
    const reqData: IRpcRequest = {
      API_key: this._config.apikey,
      id: id || Date.now(),
      jsonrpc: '2.0',
      method,
      params: params || [],
    };

    const url = this._getRpcEndpoint();
    const reqConfig = this._getRequestConfig();

    try {
      const response = await Axios.post<IRpcResponseEnvelop<T>>(url, reqData, reqConfig);
      const rawData = response.data;
      if (rawData.error) {
        throw new Error(`Something wrong: ${JSON.stringify(rawData.error)}`);
      }

      return rawData.result;
    } catch (error) {
      // Axios error handling: https://github.com/axios/axios#handling-errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw error;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        throw error;
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  }

  /**
   * JSON-RPC call func
   * @param method RPC Request Method
   * @param params RPC Request Params
   * @param id RPC Request id
   * @return RPCResponse<T>
   * @throws Response non-2xx response or request error
   */
  public async get<T>(method: string, id?: number | string): Promise<T> {
    const url = this._getBookEndpoint() + method;
    const reqConfig = this._getRequestConfig();

    try {
      const response = await Axios.get<T>(url, reqConfig);
      const rawData = response.data;

      return rawData;
    } catch (error) {
      // Axios error handling: https://github.com/axios/axios#handling-errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw error;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        throw error;
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  }

  public _getRpcEndpoint(): string {
    const protocol = this._config.protocol;
    const host = this._config.rpchost;
    const port = this._config.port;
    return `${protocol}://${host}:${port}`;
  }

  public _getBookEndpoint(): string {
    const protocol = this._config.protocol;
    const host = this._config.bookhost;
    const port = this._config.port;
    return `${protocol}://${host}:${port}`;
  }

  protected _getRequestConfig(): AxiosRequestConfig {
    return {
      headers: { 'api-key': this._config.apikey },
    };
  }
}

export default RPCClient;
