from flask import Flask, redirect, request, render_template, url_for
from urllib.parse import unquote, quote, urlparse
import threading
import netifaces

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
        current_url_short = f"{urlparse(current_url).scheme}://{urlparse(current_url).netloc}/"
        return render_template('index.html', cur_url=current_url, cur_url_short=current_url_short)

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




    # ! For the view-end

    @app.route('/no_connect')
    def page_no_connect():
        global current_url
        return render_template('no_connection.html', cur_url=current_url, cur_dom=urlparse(current_url).netloc)
        
    @app.route('/splash')
    def page_splash():
        # return render_template('splash.html', admin_url=socket.gethostbyname(socket.gethostname()))
        ip_adresses = [f'http://{link["addr"]}:8080/' for interface in netifaces.interfaces() for link in netifaces.ifaddresses(interface).get(netifaces.AF_INET, []) if link["addr"] != '127.0.0.1']
        return render_template('splash.html', admin_url=ip_adresses)

    @app.route('/clock')
    def page_clock():
        global current_url
        return render_template('clock.html')


    thread = threading.Thread(target=app.run, args=(host, port))
    
    def start(self):
        self.thread.start()
        # self.app.run(host=self.host, port=self.port, debug=True)
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




