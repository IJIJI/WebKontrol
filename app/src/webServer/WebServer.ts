import express from "express";
import { Logger } from "../logging/Logger";
import type { WebServerMutationHandlers, WebServerState } from "./model";
import { jsonReplacer } from "../helpers/json";




export class WebServer {
  private _app = express();
  private logger = new Logger(["WEBSERVER"]);

  private _state: WebServerState = {};

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
    return this._state; // TODO state serialisation
  }
}