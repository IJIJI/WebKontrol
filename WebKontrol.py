from puppet import webPuppet
from admin import webAdmin
import time


webAdmin = webAdmin()
webAdmin.serve()

print("Admin server started on port " + str(webAdmin.getPort()))

while(1):
    print(webAdmin.getPostValue())
    time.sleep(1)
# webAdmin.start()