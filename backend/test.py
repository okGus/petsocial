from flask import Flask, request, jsonify
import tensorflow as tf
import tensorflow_recommenders as tfrs
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/message', methods=['POST'])
def message():
    data = request.json

    message = data.get('message', '')

    # Just basic testing
    print(message)
    
    return jsonify({'status': 'Message received', 'message': message})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)