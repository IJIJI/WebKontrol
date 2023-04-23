from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver
import sys, os, signal, threading


class webAdmin:

    hostName = "0.0.0.0"
    serverPort = 80

    class adminFrontend(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(bytes("<html><head><title>WebKontrol</title></head>", "utf-8"))
            self.wfile.write(bytes("<p>Request: %s</p>" % self.path, "utf-8"))
            self.wfile.write(bytes("<body>", "utf-8"))
            self.wfile.write(bytes("<p>This is an example web server.</p>", "utf-8"))
            self.wfile.write(bytes("</body></html>", "utf-8"))


    webServer = socketserver.TCPServer(("", serverPort), adminFrontend)



    def __serve(self):
        self.webServer.serve_forever()


    def serve(self):

        threading.Thread(target=self.__serve).start()


        


