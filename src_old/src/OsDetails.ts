
export class OsDetails {
  
  constructor() {
  }
  
  getAddresses(){
    var os = require('os');
    var ifaces = os.networkInterfaces();
    
    const addresses: string[] = [];
    
    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;
      
      
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
          return;
        }
        
        addresses.push("http://" + iface.address + "/");
        
      });
    });
    
    return addresses;
  }
}