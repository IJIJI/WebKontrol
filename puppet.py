from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException

class webPuppet:

    # url = "https://synapt.nl/splash"
    url = "http://127.0.0.1:8080/splash"
    __url = ""

    def __init__(self, url=""):
        if url != "":
            self.url = url
        return

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_experimental_option("excludeSwitches",["enable-automation"])
    chrome_options.add_argument("--kiosk")

    driver = webdriver.Chrome(chrome_options=chrome_options)

    def get_url(self):
        return self.url

    def set_url(self, url):
        self.url = url
        return

    def update(self):
        try:
            self.driver.get(self.url)
        except WebDriverException:
            return False
        
        return True

    def stop(self):
        return
