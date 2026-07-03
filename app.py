# pyrefly: ignore [missing-import]
from flask import Flask, jsonify
from flask_cors import CORS
import socket
from datetime import datetime
import sys
import os

app = Flask(__name__)
CORS(app) # Habilita peticiones cruzadas (necesario para GitHub Pages)

# Obtener puerto desde los argumentos (por defecto 5000 según tu arquitectura)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        # Se agrega el puerto al nombre para diferenciar qué instancia responde
        "server_name": f"{socket.gethostname()} (Puerto {port})",
        "ip": socket.gethostbyname(socket.gethostname()),
        # demuestra si el servidor esta en funcionamiento
        "status": "OK",
        # da de vuelta la fecha y hora actual
        "timestamp": datetime.utcnow().isoformat() + "Z",
        # Enviamos explícitamente el puerto por si acaso
        "port": port
    }), 200


if __name__ =="__main__":
    # Desactivamos el auto-reloader en debug para evitar problemas al correr múltiples instancias
    app.run(host="0.0.0.0", port=port, debug=False)
