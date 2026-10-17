"""Tiny TCP bridge: localhost:<port> on the login node -> <node>:<port> (the UI runs on the GPU node).
Blocking sockets + threads only copy bytes, so it uses no CPU while idle. Usage: login_forward.py <node> <port>"""
import socket
import sys
import threading

node, port = sys.argv[1], int(sys.argv[2])


def pipe(a, b):
    try:
        while True:
            data = a.recv(65536)
            if not data:
                break
            b.sendall(data)
    except OSError:
        pass
    finally:
        for s in (a, b):
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            s.close()


srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", port))
srv.listen(64)
print(f"forwarding 127.0.0.1:{port} -> {node}:{port}", flush=True)
while True:
    c, _ = srv.accept()
    try:
        u = socket.create_connection((node, port), timeout=10)
        u.settimeout(None)
    except OSError as e:
        print("upstream error:", e, flush=True)
        c.close()
        continue
    threading.Thread(target=pipe, args=(c, u), daemon=True).start()
    threading.Thread(target=pipe, args=(u, c), daemon=True).start()
