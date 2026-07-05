import { Logger } from "../logging/Logger";
import type { AbstractPuppet } from "../puppet/AbstractPuppet";
import type { PuppetKey } from "../puppet/schema";


export class PuppetManager { // TODO: Make this manage the puppets, remove the rest from appcore
  private _logger = new Logger(["LifeCycle", "ORCHESTRATOR"]);

  private _hasStarted: boolean = false;

  private _puppets: Map<PuppetKey, AbstractPuppet> = new Map();


}
