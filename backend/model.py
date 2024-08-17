import tensorflow as tf
import tensorflow_recommenders as tfrs

class PetSocialRecommender(tfrs.Model):
    def __init__(self):
        super().__init__()
        
        # User model
        self.user_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=users['user_id']),
            tf.keras.layers.Embedding(len(users) + 1, 32)
        ])
        
        # Post model
        self.post_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=posts['post_id']),
            tf.keras.layers.Embedding(len(posts) + 1, 32)
        ])
        
        # Retrieval task
        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=posts.batch(128).map(self.post_model)
            )
        )
    
    def compute_loss(self, features: Dict[Text, tf.Tensor], training=False) -> tf.Tensor:
        user_embeddings = self.user_model(features["user_id"])
        post_embeddings = self.post_model(features["post_id"])
        
        return self.task(user_embeddings, post_embeddings)
