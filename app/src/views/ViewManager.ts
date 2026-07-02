import EventEmitter from "node:events";
import type { AbstractView, ViewKey } from "./types/AbstractView";

export type ViewManagerEvents = {
  'view_added': [view: AbstractView]
}

export class ViewManager extends EventEmitter<ViewManagerEvents>{
  private _views: Map<ViewKey, AbstractView> = new Map();
}