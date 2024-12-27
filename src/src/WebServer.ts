import { EventEmitter } from "events";
import express from 'express';
import path from 'path';
import Twig from 'twig';
import { SettingLoader } from "./SettingLoader";

export interface WebServerEvents {
  error: () => void;
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
  
  settingLoader: SettingLoader;
  
  constructor(settings: SettingLoader) {
    super();

    this.settingLoader = settings;
    
    // this.app.set('view engine', 'pug');
    // this.app.set('views', './views');
    this.app.set("twig options", {
      allowAsync: true, // Allow asynchronous compiling
      strict_variables: false
    });
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    this.app.use('/static', express.static('static'));
    // this.app.use('/static', express.static(path.join(__dirname, 'static')))
    
    
    this.app.get('/', (req, res) => {
      // res.render('index', { title: 'Hey', message: 'Hello there!' })
      res.render('index.html.twig', {
        cur_url : this.settingLoader.getSettings().url,
        cur_url_short: this.shortenUrl(this.settingLoader.getSettings().url)
      });
    });
    
    this.app.post('/set_url', (req, res) => {
      // res.send(req.bod);
      console.log('POST parameter received are: ',req.body);
      res.render('updated.html.twig', {
      });
      this.settingLoader.set('url', req.body.url);
    });
    
    
    this.app.get('/updated', (req, res) => {
      // this.emit('sourceChange');
      res.send('Updated');
    });
    
    // PUPPET SIDE
    this.app.get('/clock', (req, res) => {
      res.render('clock.html.twig', {
      });
    });
    this.app.get('/no_connect', (req, res) => {
      res.render('no_connect.html.twig', {
        cur_url : this.settingLoader.getSettings().url,
        cur_url_short: this.shortenUrl(this.settingLoader.getSettings().url)
      });
    });
    this.app.get('/splash', (req, res) => {
      res.render('splash.html.twig', {
        admin_url : ["google.com", "synapt.eu"],
      });
    });
    this.app.get('/splash/simple', (req, res) => {
      res.render('splash_simple.html.twig', {
        admin_url : ["google.com", "synapt.eu"],
      });
    });
  }
  
  start() {
    
    this.app.listen(this.port, () => {
      console.log(`Web Server started on port ${this.port}`)
    })
  }

  shortenUrl(url: string){
    const urlObj = new URL(url);
    return urlObj.hostname;  
  }
}