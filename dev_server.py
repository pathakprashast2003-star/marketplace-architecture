import http.server
import socketserver

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def _rewrite_path(self):
        if self.path == '/index-v2.html' or self.path.startswith('/index-v2.html?'):
            self.path = '/index.html'
        elif self.path == '/explore' or self.path.startswith('/explore?'):
            self.path = '/explore.html'
        elif self.path == '/c' or self.path == '/c/':
            self.path = '/explore.html'
        elif self.path.startswith('/c/'):
            # creator profile pages: /c/<slug> -> creator.html (the page reads the slug from the address)
            self.path = '/creator.html'

    def do_HEAD(self):
        self._rewrite_path()
        super().do_HEAD()

    def do_GET(self):
        self._rewrite_path()
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            self.rfile.read(content_length)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(b'{"ok": true, "edit_token": "mock-dev-token"}')
            return
        self.send_response(404)
        self.end_headers()

    def do_PATCH(self):
        return self.do_POST()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', 3000), NoCacheHandler) as httpd:
        httpd.serve_forever()
