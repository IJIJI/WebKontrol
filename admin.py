from flask import Flask, redirect, request, url_for
from urllib.parse import unquote, quote

class webAdmin:

    port = 80
    host = '0.0.0.0'

    global postValue
    postValue = []

    app = Flask(__name__)


    @app.route('/')
    def page_index():
        global postValue
        newValue = postValue
        postValue = []
        return 'Hello World! [' + ', '.join(newValue) + ']'

    @app.route('/1')
    def page_success():
        return 'Success! Go back to the main page to see the new value.'
        
    @app.route('/set_url/', methods=['POST' , 'GET'])
    def set_url():
        if(request.form['url'] == None):
            return "No URL given."

        global postValue
        postValue.append(unquote("url"))
        return redirect("/success", code=302)


    
    def start(self):
        self.app.run(self.host, self.port)



    def getPostValue(self):
        global postValue

        if len(postValue) == 0:
            return None

        oldPostValue = postValue
        postValue = []
        return oldPostValue[len(oldPostValue)-1]


