from selenium import webdriver
from selenium.webdriver.chrome.options import Options

class webPuppet:

    # url = "https://synapt.nl/splash/"
    url = "https://synapt.nl/"

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
        self.driver.get(self.url)
        return

    def stop(self):
        return
