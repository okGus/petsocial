import pandas as pd
import tensorflow as tf
import tensorflow_recommenders as tfrs
from transformers import BertTokenizer, TFBertModel
from typing import Dict, Text
import numpy as np

# Load BERT tokenizer and model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_model = TFBertModel.from_pretrained('bert-base-uncased')

# Fake data
users = {
    'user_id': ['user_1', 'user_2', 'user_3']
}
posts = {
    'post_id': ['post_1', 'post_2', 'post_3', 'post_4', 'post_5', 'post_6', 'post_7', 'post_8', 'post_9', 'post_10'],
    'content': ['Apples', 'Cars', 'Window', 'Orange', 'Pencil', 'Camera', 'Key', 'Lock', 'Desk', 'Number']
}
interactions = pd.DataFrame({
    'user_id': ['user_1', 'user_1', 'user_2', 'user_3', 'user_3', 'user_1', 'user_1', 'user_1', 'user_1', 'user_1', 'user_1', 'user_1'],
    'post_id': ['post_1', 'post_2', 'post_2', 'post_3', 'post_1', 'post_4', 'post_5', 'post_6', 'post_7', 'post_8', 'post_9', 'post_10'],
    'content': ['Apples', 'Cars', 'Cars', 'Window', 'Apples', 'Orange', 'Pencil', 'Camera', 'Key', 'Lock', 'Desk', 'Number'],
    'interaction': ['like', 'dislike', 'like', 'like', 'dislike', 'dislike', 'dislike', 'dislike', 'dislike', 'dislike', 'dislike', 'dislike']
})

def preprocess_content(content):
    # Tokenize and get BERT embeddings
    inputs = tokenizer(content, return_tensors='tf', truncation=True, padding=True, max_length=512)
    outputs = bert_model(**inputs)
    return outputs.last_hidden_state[:, 0, :].numpy()  # Take the [CLS] token embedding

# Preprocess the data
interaction_embeddings = np.array([preprocess_content(content) for content in interactions['content']])
post_embeddings = np.array([preprocess_content(post) for post in posts['content']])

interaction_ds = tf.data.Dataset.from_tensor_slices({
    "user_id": interactions['user_id'].to_numpy(),
    "content": interaction_embeddings,
    "interaction": interactions['interaction'].to_numpy()
})

# Create TensorFlow dataset for post content embeddings
post_ds = tf.data.Dataset.from_tensor_slices(post_embeddings)

class PetSocialRecommender(tfrs.Model):
    def __init__(self):
        super().__init__()

        # User model
        self.user_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=users['user_id']),
            tf.keras.layers.Embedding(input_dim=len(users['user_id']) + 1, output_dim=64),
        ])

        # Post model using BERT embeddings
        self.post_model = tf.keras.layers.Dense(64, activation='relu')

        post_embeddings_squeezed = tf.squeeze(post_embeddings, axis=1)

        # Create candidate embeddings and store them in a tensor
        self.candidate_embeddings = tf.convert_to_tensor(post_embeddings_squeezed, dtype=tf.float32)

        # Create candidate embeddings dataset
        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=tf.data.Dataset.from_tensor_slices(self.candidate_embeddings).batch(128).map(self.post_model)
            )
        )

    def compute_loss(self, features: Dict[Text, tf.Tensor], training=False) -> tf.Tensor:
        content = tf.squeeze(features["content"], axis=1)
        user_embeddings = self.user_model(features['user_id'])  # (batch_size, embedding_dim)
        post_embeddings = self.post_model(content)  # (batch_size, embedding_dim)

        # user_embeddings_squeezed = tf.squeeze(user_embeddings, axis=1)

        # print(user_embeddings.shape, post_embeddings.shape)
        # exit()

        # Compute the loss
        loss = self.task(user_embeddings, post_embeddings)
        
        # Adjust the loss based on interactions
        interaction = features['interaction']
        positive_loss_weight = 1.0
        negative_loss_weight = 0.1

        interaction_weights = tf.where(
            interaction == 'like',
            tf.ones_like(interaction, dtype=tf.float32) * positive_loss_weight,
            tf.ones_like(interaction, dtype=tf.float32) * negative_loss_weight
        )

        # Element-wise multiplication of loss and weights
        weighted_loss = loss * interaction_weights

        return tf.reduce_sum(weighted_loss) / tf.reduce_sum(interaction_weights)

model = PetSocialRecommender()
model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.1))
model.fit(interaction_ds.batch(2), epochs=20)

# Recommendations
index = tfrs.layers.factorized_top_k.BruteForce(model.user_model)
index.index_from_dataset(
    tf.data.Dataset.from_tensor_slices(tf.squeeze(post_embeddings, axis=1)).batch(3).map(lambda content: (content, model.post_model(content)))
)

# Get recommendations from the model
_, recommended_post_ids = index(np.array(['user_1']))

# output = tf.squeeze(recommended_post_ids, axis=0)

post_id_to_embedding = {}
for post_id, content in zip(posts['post_id'], posts['content']):
    inputs = tokenizer(content, return_tensors='tf', truncation=True, padding=True, max_length=512)
    outputs = bert_model(**inputs)
    embedding = outputs.last_hidden_state[:, 0, :].numpy().flatten()  # Get the [CLS] token embedding
    post_id_to_embedding[post_id] = embedding

# Now get post_id from each embedding
recommended_posts = []
for post_embedding in recommended_post_ids[0]:
    for post_id, embedding in post_id_to_embedding.items():
        if np.array_equal(post_embedding, embedding):
            recommended_posts.append(post_id)

print(recommended_posts)
