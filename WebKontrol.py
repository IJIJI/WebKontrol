from puppet import webPuppet
from admin import webAdmin
from config import webConfig
import time

puppet = webPuppet()
puppet.update()

admin = webAdmin()
admin.start()

admin.set_url(puppet.get_url())

while(1):
    try:
        time.sleep(0.1)
        postvalue = admin.getPostValue()
        if (postvalue != None):

            postvalueOld = puppet.get_url()
            puppet.set_url(postvalue)
            if(puppet.update()):
                admin.set_url(puppet.get_url())
                print("New URL: " + postvalue)
            else:
                time.sleep(4)
                puppet.set_url(postvalueOld)
                puppet.update()
                admin.set_url(puppet.get_url())
                print("Failed updating url, reverting to: " + postvalueOld)
    except KeyboardInterrupt:
        puppet.stop()
        admin.stop()
        break

print("Shutting down...")