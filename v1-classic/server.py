#!/usr/bin/env python3
"""Local dev server for v1-classic.

Same idea as `python3 -m http.server`, except it tells the browser
NOT to cache. Without this, iPads happily hold onto old JS for ages
and you wonder why your change didn't show up.

Usage: python3 server.py [port]   (default port 8080)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f'v1-classic listening on http://localhost:{port}  (no-cache headers set)')
    ThreadingHTTPServer(('0.0.0.0', port), NoCacheHandler).serve_forever()
