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

    this.app.set('view engine', 'pug');
    this.app.set('views', './views');

    this.app.use('/static', express.static('static'));
    // this.app.use('/static', express.static(path.join(__dirname, 'static')))


    this.app.get('/', (req, res) => {
      res.render('index', { title: 'Hey', message: 'Hello there!' })
    });

    this.app.get('/updated', (req, res) => {
      // this.emit('sourceChange');
      res.send('Updated');
    });

    // PUPPET SIDE
    this.app.get('/clock', (req, res) => {
      res.render('clock', { title: 'Clock' })
    });
    this.app.get('/no_connect', (req, res) => {
      res.render('no_connect', {})
    });
    this.app.get('/splash', (req, res) => {
      res.render('splash', {})
    });
  }

  start() {

    this.app.listen(this.port, () => {
      console.log(`Web Server started on port ${this.port}`)
    })
  }
}