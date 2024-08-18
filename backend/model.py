import tensorflow as tf
import tensorflow_recommenders as tfrs
from typing import Dict, Text

class PetSocialRecommender(tfrs.Model):
    def __init__(self, users, posts):
        super().__init__()

        self.posts = posts
        self.users = users

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

        post_ds = tf.data.Dataset.from_tensor_slices(posts['content'])

        # Create candidate embeddings
        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=post_ds.batch(128).map(self.post_model)
            )
        )

    def compute_loss(self, features: Dict[Text, tf.Tensor], training=False) -> tf.Tensor:
        user_embeddings = self.user_model(features["user_id"])  # (batch_size, embedding_dim)
        post_embeddings = self.post_model(features["content"])  # (batch_size, embedding_dim)

        # Return the task loss
        return self.task(user_embeddings, post_embeddings)
