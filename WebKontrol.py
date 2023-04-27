from puppet import webPuppet
from admin import webAdmin
import time


webAdmin = webAdmin()
webAdmin.start()




print(webAdmin.getPostValue())
print(webAdmin.getPostValue())
print("Shutting down...")