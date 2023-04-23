from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver
import sys, os, signal, threading

from io import BytesIO


class webAdmin:

    hostName = "0.0.0.0"
    serverPort = 80

    class adminFrontend(BaseHTTPRequestHandler):

        postValue = "b"

        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(bytes("<html><head><title>WebKontrol</title></head>", "utf-8"))
            self.wfile.write(bytes("<p>Request: %s</p>" % self.path, "utf-8"))
            self.wfile.write(bytes("<body>", "utf-8"))
            self.wfile.write(bytes("<p>This is an example web server.</p>", "utf-8"))
            self.wfile.write(bytes('<form method="post"><input type="text" placeholder="" value="" name="urlInput" required=""><button>submit</button></form>', 'utf-8'))
            self.wfile.write(bytes("</body></html>", "utf-8"))

            self.postValue = self.path

            return

        def do_POST(self):
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            # self.send_response(200)
            # self.end_headers()
            # response = BytesIO()
            # response.write(b'This is POST request. ')
            # response.write(b'Received: ')
            # response.write(body)
            # self.wfile.write(response.getvalue())
            self.do_GET()
            self.postValue = body

            return

        def getPostValue(self):
            postValue = self.postValue
            self.postValue = ""
            return postValue


    webServer = socketserver.TCPServer(("", serverPort), adminFrontend)



    def __serve(self):
        self.webServer.serve_forever()


    def serve(self):

        threading.Thread(target=self.__serve).start()

    def getPostValue(self):
        return self.webServer.RequestHandlerClass.getPostValue(self.webServer.RequestHandlerClass)

    def getPort(self):
        return self.serverPort
    


        


