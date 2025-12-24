CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diary_entries (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    content TEXT,
    date DATE,
    tags TEXT[],
    mood VARCHAR(50),
    privacy VARCHAR(20),
    is_story BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS likes (
    user_id BIGINT NOT NULL,
    entry_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, entry_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (entry_id) REFERENCES diary_entries(id)
);

CREATE TABLE IF NOT EXISTS votes (
    user_id BIGINT NOT NULL,
    entry_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, entry_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (entry_id) REFERENCES diary_entries(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entry_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (entry_id) REFERENCES diary_entries(id)
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id BIGINT;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_parent;
ALTER TABLE comments ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS folder_id VARCHAR(255);
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS fk_diary_entries_folder;
ALTER TABLE diary_entries ADD CONSTRAINT fk_diary_entries_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    cover_image TEXT,
    file_data BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    progress VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS book_notes (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id VARCHAR(255) NOT NULL,
    cfi_range TEXT NOT NULL,
    content TEXT,
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE "public"."votes" (
                                  "user_id" int8 NOT NULL,
                                  "entry_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                  CONSTRAINT "votes_pkey" PRIMARY KEY ("user_id", "entry_id"),
                                  CONSTRAINT "votes_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."diary_entries" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                  CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."votes"
    OWNER TO "postgres";