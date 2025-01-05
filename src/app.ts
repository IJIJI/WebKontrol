import { WebKontrol } from "./src/WebKontrol";


const args = process.argv.slice(2);

var chromiumLocation: string|undefined = undefined;

if(args.length > 0){

    chromiumLocation = args.find((arg) => arg.startsWith("--chromium="))?.split("=")[1];
    
    if (chromiumLocation){

        console.log("Starting with custom Chromium location:", chromiumLocation);
    }
}


const webKontrol = new WebKontrol(chromiumLocation);


