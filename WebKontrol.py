from puppet import webPuppet
from admin import webAdmin
from config import webConfig
import time

puppet = webPuppet()
puppet.start()

admin = webAdmin()
admin.start()

while(1):
    try:
        time.sleep(0.1)
        if (postvalue := admin.getPostValue()) != None:
            puppet.set_url(postvalue)
            print("New value: " + postvalue)
    except KeyboardInterrupt:
        puppet.stop()
        admin.stop()
        break

print("Shutting down...")