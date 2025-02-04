
import { SettingLoader } from "./SettingLoader";
import { WebServer } from "./WebServer";
import { Puppet } from "./Puppet";


export class WebKontrol {

    webServer: WebServer;
    puppet: Puppet;
    settingLoader: SettingLoader;

    constructor(chromiumLocation: string|undefined = undefined) {
        // super();
        this.settingLoader = new SettingLoader();
        this.webServer = new WebServer(this.settingLoader);
        this.puppet = new Puppet(chromiumLocation);


        this.settingLoader.on('loaded', (config) => 
        {
            this.webServer.start();
            this.puppet.init().then(() =>
            {
                this.puppet.openPage(this.settingLoader.getSettings().url);
            });           
        });
      
        this.webServer.on('reload', () => {
            this.puppet.openPage(this.settingLoader.getSettings().url);
            console.log("Puppet reloaded!");
        });
      
        this.settingLoader.load();

        this.settingLoader.on('set_url', (value: string) => {
            console.log("Url Set!", value);
            this.puppet.openPage(value);
        });
    }

}








