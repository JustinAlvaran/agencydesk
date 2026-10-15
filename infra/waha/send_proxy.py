"""Authenticated, send-only bridge. Full WAHA control and chat APIs stay private."""
import hmac
import http.client
import json
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PRIVATE = Path(__file__).resolve().parents[2] / '.local' / 'waha'
MAX_BODY = 16384


def read_env(path):
    return dict(line.split('=', 1) for line in path.read_text(encoding='utf-8-sig').splitlines()
                if line and not line.startswith('#') and '=' in line)


def validate(value, session):
    if not isinstance(value, dict) or set(value) != {'session', 'chatId', 'text', 'linkPreview'}:
        raise ValueError('invalid_fields')
    if value['session'] != session or not isinstance(value['chatId'], str) or not re.fullmatch(r'[1-9]\d{7,14}@c\.us', value['chatId']):
        raise ValueError('invalid_destination')
    if not isinstance(value['text'], str) or not value['text'].strip() or len(value['text']) > 5000 or value['linkPreview'] is not False:
        raise ValueError('invalid_text')
    return value


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_):
        pass

    def setup(self):
        super().setup()
        self.connection.settimeout(12)

    def reply(self, status, value):
        raw = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(raw)
        self.close_connection = True

    def do_GET(self):
        self.reply(405, {'error': 'method_not_allowed'})

    do_PUT = do_DELETE = do_OPTIONS = do_PATCH = do_GET

    def do_POST(self):
        if self.path != '/api/sendText':
            return self.reply(404, {'error': 'unknown_route'})
        if not hmac.compare_digest(self.headers.get('X-Api-Key', ''), self.server.bridge_key):
            return self.reply(401, {'error': 'unauthorized'})
        if self.headers.get('Transfer-Encoding') or self.headers.get_content_type() != 'application/json':
            return self.reply(400, {'error': 'invalid_request'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 1 <= length <= MAX_BODY:
                return self.reply(413, {'error': 'invalid_size'})
            payload = validate(json.loads(self.rfile.read(length)), self.server.session)
        except (ValueError, TypeError, TimeoutError):
            return self.reply(400, {'error': 'invalid_payload'})
        if not self.server.send_lock.acquire(blocking=False):
            return self.reply(429, {'error': 'busy'})
        connection = http.client.HTTPConnection('127.0.0.1', 3001, timeout=8)
        try:
            connection.request('POST', '/api/sendText', json.dumps(payload),
                               {'Content-Type': 'application/json', 'X-Api-Key': self.server.upstream_key})
            response = connection.getresponse()
            raw = response.read(65537)
            if len(raw) > 65536:
                return self.reply(502, {'error': 'upstream_result_unknown'})
            # Only a successful, bounded ACK is forwarded. Diagnostic failures can
            # happen after a send and must never be translated to a safe rejection.
            if response.status not in (200, 201):
                return self.reply(502, {'error': 'upstream_result_unknown'})
            data = json.loads(raw)
            identifier = data.get('id')
            if isinstance(identifier, dict):
                identifier = identifier.get('_serialized')
            if not isinstance(identifier, str) or len(identifier) > 300 or data.get('fromMe') is not True:
                return self.reply(502, {'error': 'upstream_result_unknown'})
            return self.reply(200, {'id': identifier, 'fromMe': True, 'ack': data.get('ack')})
        except (OSError, ValueError, TypeError):
            self.reply(502, {'error': 'upstream_result_unknown'})
        finally:
            connection.close()
            self.server.send_lock.release()


def main():
    config = read_env(PRIVATE / 'proxy.env')
    upstream = read_env(PRIVATE / '.env')['WAHA_API_KEY']
    key = config['WAHA_PROXY_KEY']
    if len(key) < 32 or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', config['WAHA_SESSION']):
        raise ValueError('invalid_private_configuration')
    server = ThreadingHTTPServer(('127.0.0.1', 3002), Handler)
    server.bridge_key, server.upstream_key, server.session = key, upstream, config['WAHA_SESSION']
    server.send_lock = threading.Lock()
    server.serve_forever()


if __name__ == '__main__':
    main()
