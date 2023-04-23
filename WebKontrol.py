from puppet import webPuppet
from admin import webAdmin
import time


webAdmin = webAdmin()
webAdmin.serve()

# while(1):
#     print("Hello")
#     time.sleep(1)
# webAdmin.start()