from puppet import webPuppet
from admin import webAdmin
import time


admin = webAdmin()
admin.start()

while(1):
    try:
        time.sleep(0.01)
        if (postvalue := admin.getPostValue()) != None:
            print("New value: " + postvalue)
    except KeyboardInterrupt:
        puppet.stop()
        admin.stop()
        break

print("Shutting down...")