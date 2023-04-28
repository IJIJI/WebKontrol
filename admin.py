from flask import Flask, redirect, request, render_template, url_for
from urllib.parse import unquote, quote
import threading

class webAdmin:

    port = 8080
    host = '0.0.0.0'

    global postValue
    postValue = []
    global current_url
    current_url=""

    app = Flask(__name__)

    

    # ! For the admin-end

    @app.route('/')
    def page_index():
        global current_url
        return render_template('index.html', cur_url=current_url)

    @app.route('/upated')
    def page_upated():
        return render_template('updated.html', cur_url=current_url)

        
    @app.route('/set_url', methods=['POST'])
    def set_url():

        if(request.form['url'] == None):
            return "No URL given."

        global postValue
        postValue.append(unquote(request.form['url']))

        return redirect("/upated", code=302)


    @app.route('/reload')
    def page_reload():


        global postValue
        postValue.append(current_url)

        return redirect("/upated", code=302)


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

    def set_url(self, url):
        global current_url
        current_url = url
        return




