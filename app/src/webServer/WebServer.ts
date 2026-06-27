import express from "express";
import { Logger } from "../logging/Logger";
import type { WebServerMutationHandlers, WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";




export class WebServer {
  private _app = express();
  private logger = new Logger(["WEBSERVER"]);

  private _state: WebServerState = {
    puppets: []
  };

  private _handlers!: WebServerMutationHandlers;
  
  // private _updateManager: UpdateManager;

  private _sseClients: Set<express.Response> = new Set();

  // constructor(updateManager: UpdateManager) {
  //   this.updateManager = updateManager;
  // }
  constructor() {
    this._app.set('json replacer', jsonReplacer)
  }

  private _serializeState() {
    return JSON.stringify(this._state, jsonReplacer);
  }

  public setState(state: WebServerState): void {
    this._state = state;
    if (this._sseClients.size > 0) {
      const data = `data: ${JSON.stringify(this._serializeState())}\n\n`; // TODO: Right format?
      for (const res of this._sseClients) res.write(data);
    }
  }
  
  public _setHandlers(handlers: WebServerMutationHandlers): void {
    this._handlers = handlers;
  }
}