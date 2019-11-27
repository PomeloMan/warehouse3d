import axios, { AxiosInstance } from 'axios';

// 环境变量 @reference webpack.config.dev.js webpack.DefinePlugin
declare const BASE_URL;

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 1000 * 30,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
});

export class HttpClient {

  static http: AxiosInstance = http;

  static get(url, params?) {
    return this.http.get(url, { params: params });
  }
}