from puppet import webPuppet
from admin import webAdmin
from config import webConfig
import time

config = webConfig()

admin = webAdmin()
admin.start()

puppet = webPuppet()
puppet.update()




def tryUpdate(postvalue = None):
    
    postvalueNew = admin.getPostValue()

    if(postvalueNew == "" or postvalueNew != None):
        postvalue = postvalueNew

    elif(postvalue == "" or postvalue == None):
        return False

    puppet.set_url(postvalue)
    admin.set_url(puppet.get_url())
    config.set_url(puppet.get_url())
    config.save()


    if(puppet.update()):
        print("New URL: " + postvalue)

        return True

    else:
        postvalueNew = admin.getPostValue()            
        sleeptime = 30 + time.time()
        while (sleeptime > time.time()):
            time.sleep(0.1)
            postvalueNew = admin.getPostValue()
            if(postvalueNew != None):
                postvalue = postvalueNew
                break
        return tryUpdate(postvalue)



if config.check_config():
    config.load()
    print("Config found, URL: " + puppet.get_url())
    tryUpdate(config.get_url())
else:
    print("No config found.")
    tryUpdate(puppet.get_url())


while(1):
    try:
        time.sleep(0.1)

        tryUpdate()
    except KeyboardInterrupt:
        puppet.stop()
        admin.stop()
        break

print("Shutting down...")