import { EventEmitter } from "events";
import express from 'express';
import path from 'path';

export interface WebServerEvents {
  sourceChange: () => void;
}

export declare interface WebServer {
  on<U extends keyof WebServerEvents>(
    event: U, listener: WebServerEvents[U]
  ): this;

  emit<U extends keyof WebServerEvents>(
    event: U, ...args: Parameters<WebServerEvents[U]>
  ): boolean;
}

export class WebServer extends EventEmitter {
  private app = express();
  private port = 80;

  // settingLoader: SettingLoader;

  constructor() {
  // constructor(settingLoader: SettingLoader) {
    super();
    this.app.get('/', (req, res) => {
      res.send('Hello World! boo')
    })    

    this.app.use('/static', express.static('static'));
    // this.app.use('/static', express.static(path.join(__dirname, 'static')))

  }

  start() {

    this.app.listen(this.port, () => {
      console.log(`Web Server started on port ${this.port}`)
    })
  }
}