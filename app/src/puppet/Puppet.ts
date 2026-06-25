import { EventEmitter } from "node:stream";


export type PuppetEvents = {
  failed_load: [error: Error];
  successful_load: []; // TODO: Return data? Screenshot?
};

export class Puppet extends EventEmitter<PuppetEvents> {

}