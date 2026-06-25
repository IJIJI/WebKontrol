

import { EventEmitter } from "events";

import fs from 'node:fs';

export interface SettingLoaderEvents {
  loaded: (settings: SettingLoader.Settings) => void;
  set_url: (value: string) => void;
}

export declare interface SettingLoader {
  on<U extends keyof SettingLoaderEvents>(
    event: U, listener: SettingLoaderEvents[U]
  ): this;
  
  emit<U extends keyof SettingLoaderEvents>(
    event: U, ...args: Parameters<SettingLoaderEvents[U]>
  ): boolean;
}

export class SettingLoader extends EventEmitter 
{
  settings: SettingLoader.Settings;

  constructor() {
    super();

    this.settings = new SettingLoader.Settings;
  }

  getSettings(): SettingLoader.Settings {
    return this.settings;
  }

  set(key: string, value: string): boolean {
    if (this.settings == null) return false;

    switch (key) {
      case 'url':
        this.settings.url = value;
        this.emit('set_url', this.settings.url);
        break;
    }
    console.log('Settings updated: ', key, this.settings);

    this._save();

    return true
  }

  load(): void {

    try {
      const jsonData = fs.readFileSync('config.json', 'utf8');

      const data = JSON.parse(jsonData);

      this.settings = Object.assign(this.settings, data);
      // this.config.tally = Object.assign(this.config.tally, JSON.parse(data).tally);

      console.log('SETTINGS: Loaded: ', this.settings);
    } catch (e) {
      console.log('SETTINGS: Failed loading. Setting defaults: ', this.settings);
      this._save();
    }
    this.emit('loaded', this.settings);
  }


  _save(): void {
    fs.writeFileSync('config.json', this.settings.toJSON());
  }
}

export namespace SettingLoader
{
  
  export class Settings
  {
    url: string = 'http://127.0.0.1/splash';
    
    toArray(): {[key: string]: any} {
      return {
        'url': this.url,
      };
    };
    
    toJSON(): string {
      return JSON.stringify(this.toArray());
    }
  }
  
}
