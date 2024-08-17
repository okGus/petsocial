import pandas as pd
import tensorflow as tf
import tensorflow_recommenders as tfrs
from typing import Dict, Text
import numpy as np

# Fake data
users = {
    'user_id': ['user_1', 'user_2', 'user_3']  # List of unique user IDs
}
posts = {
    'post_id': ['post_1', 'post_2', 'post_3', 'post_4', 'post_5', 'post_6', 'post_7', 'post_8', 'post_9', 'post_10'],  # List of unique post IDs
    'content': ['This is post 1', 'This is post 2', 'This is post 3', 'This is post 4', 'This is post 5', 'This is post 6', 'This is post 7', 'This is post 8', 'This is post 9', 'This is post 10']
}
interactions = pd.DataFrame({
    'user_id': ['user_1', 'user_1', 'user_2', 'user_3', 'user_3'],
    'post_id': ['post_1', 'post_2', 'post_2', 'post_3', 'post_1'],
    'content': ['This is post 1', 'This is post 2', 'This is post 2', 'This is post 3', 'This is post 1'],
    'interaction': ['like', 'dislike', 'like', 'like', 'dislike']
})

interaction_ds = tf.data.Dataset.from_tensor_slices(dict(interactions))
interaction_ds = interaction_ds.map(lambda x: {
    "user_id": x["user_id"],
    "content": x["content"]
})

# Create TensorFlow dataset for post content
post_ds = tf.data.Dataset.from_tensor_slices(posts['content'])

class PetSocialRecommender(tfrs.Model):
    def __init__(self):
        super().__init__()

        # User model
        self.user_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=users['user_id']),
            tf.keras.layers.Embedding(input_dim=len(users['user_id']) + 1, output_dim=64),
        ])

        # Post model
        text_vectorization = tf.keras.layers.TextVectorization(max_tokens=1000, output_mode='int')
        text_vectorization.adapt(tf.data.Dataset.from_tensor_slices(posts['content']))

        self.post_model = tf.keras.Sequential([
            text_vectorization,
            tf.keras.layers.Embedding(input_dim=text_vectorization.vocabulary_size(), output_dim=64),
            tf.keras.layers.GlobalAveragePooling1D()  # Aggregate token embeddings into a fixed-size representation
        ])

        # Create candidate embeddings
        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=post_ds.batch(128).map(self.post_model)
            )
        )

    def compute_loss(self, features: Dict[Text, tf.Tensor], training=False) -> tf.Tensor:
        user_embeddings = self.user_model(features["user_id"])  # (batch_size, embedding_dim)
        post_embeddings = self.post_model(features["content"])  # (batch_size, embedding_dim)
        
        print(user_embeddings.shape)
        print(post_embeddings.shape)

        # Return the task loss
        return self.task(user_embeddings, post_embeddings)

model = PetSocialRecommender()
model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.1))
model.fit(interaction_ds.batch(2), epochs=5)

# Recommendations
post_ds = tf.data.Dataset.from_tensor_slices(posts['content'])
index = tfrs.layers.factorized_top_k.BruteForce(model.user_model)
index.index_from_dataset(
    post_ds.batch(3).map(lambda content: (content, model.post_model(content)))
)

# Get recommendations from the model
_, recommended_post_ids = index(np.array(['user_1']))

print(recommended_post_ids)
