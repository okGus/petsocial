from flask import Flask, request, jsonify
import tensorflow as tf
import tensorflow_recommenders as tfrs
from flask_cors import CORS
from model import PetSocialRecommender

app = Flask(__name__)
CORS(app)

@app.route('/api/message', methods=['POST'])
def message():
    data = request.json

    message = data.get('message', '')

    # Just basic testing
    print(message)

    return jsonify({'status': 'Message received', 'message': message})

def recommend():
    import tensorflow as tf

    # Convert interactions to a TensorFlow dataset
    interaction_ds = tf.data.Dataset.from_tensor_slices(dict(interactions))
    interaction_ds = interaction_ds.map(lambda x: {
        "user_id": x["user_id"],
        "post_id": x["post_id"]
    })

    # Create and compile the model
    model = PetSocialRecommender()
    model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.1))

    # Initial training
    model.fit(interaction_ds.batch(2), epochs=5)

def update_model_with_new_data(model, new_interactions):
    new_interactions_ds = tf.data.Dataset.from_tensor_slices(dict(new_interactions))
    new_interactions_ds = new_interactions_ds.map(lambda x: {
        "user_id": x["user_id"],
        "post_id": x["post_id"]
    })
    
    model.fit(new_interactions_ds.batch(2), epochs=1, verbose=1)

def recommend_posts_for_user(model, user_id):
    user_embedding = model.user_model(tf.constant([user_id]))
    _, post_ids = model.task(user_embedding).numpy()
    return post_ids


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)