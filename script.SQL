CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY
);

CREATE TABLE follows (
    user_id VARCHAR(255),
    target_user_id VARCHAR(255),
    PRIMARY KEY (user_id, target_user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),          -- The user receiving the notification
    from_user_id VARCHAR(255),    -- The user who triggered the notification
    type VARCHAR(50) NOT NULL,     -- Type of notification (e.g., "mention", "like")
    resource_id INT,              -- ID of the resource associated with the notification
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);