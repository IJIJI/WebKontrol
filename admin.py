from flask import Flask, redirect, request, url_for
from urllib.parse import unquote, quote
import threading

class webAdmin:

    port = 80
    host = '0.0.0.0'

    global postValue
    postValue = []

    app = Flask(__name__)

    

    @app.route('/')
    def page_index():
        return 'Hello World! <form action="/set_url" method="post"><input type="text" name="url"><input type="submit" value="Submit"></form>'

    @app.route('/success')
    def page_success():
        return 'Success! Go back to the <a href="/">main page</a> to see the new value.'
        
    @app.route('/set_url', methods=['POST'])
    def set_url():

        if(request.form['url'] == None):
            return "No URL given."

        global postValue
        postValue.append(unquote(request.form['url']))

        return redirect("/success", code=302)



    thread = threading.Thread(target=app.run, args=(host, port))
    
    def start(self):
        self.thread.start()
        return

    def stop(self):
        self.thread.join()
        return

    def getPostValue(self):
        global postValue

        if len(postValue) == 0:
            return None

        oldPostValue = postValue
        postValue = []
        return oldPostValue[len(oldPostValue)-1]

    def getPostValueString(self):
        postValue = self.getPostValue()
        if postValue == None:
            return ""
        return postValue



