import json

class webConfig:

    url = ""

    def check_config(self):
        try:
            with open('config.json') as json_file:
                data = json.load(json_file)
        except FileNotFoundError:
            return False
        return True

    def load(self):
        with open('config.json') as json_file:
            data = json.load(json_file)
            self.url = data['url']
        return

    def save(self):
        data = {}
        data['url'] = self.url
        with open('config.json', 'w') as outfile:
            json.dump(data, outfile)
        return

    def set_url(self, url):
        self.url = url
        return

    def get_url(self):
        return self.url

