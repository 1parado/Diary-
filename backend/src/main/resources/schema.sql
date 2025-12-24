CREATE DATABASE diary_db;
USE diary_db;

CREATE TABLE "public"."book_notes" (
                                       "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                       "user_id" int8 NOT NULL,
                                       "book_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                       "cfi_range" text COLLATE "pg_catalog"."default" NOT NULL,
                                       "content" text COLLATE "pg_catalog"."default",
                                       "color" varchar(50) COLLATE "pg_catalog"."default",
                                       "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                       CONSTRAINT "book_notes_pkey" PRIMARY KEY ("id"),
                                       CONSTRAINT "book_notes_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                                       CONSTRAINT "book_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."book_notes"
    OWNER TO "postgres";

CREATE TABLE "public"."books" (
                                  "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "user_id" int8 NOT NULL,
                                  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "author" varchar(255) COLLATE "pg_catalog"."default",
                                  "cover_image" text COLLATE "pg_catalog"."default",
                                  "file_data" bytea,
                                  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                  "last_read_at" timestamp(6),
                                  "progress" varchar(255) COLLATE "pg_catalog"."default",
                                  "format" varchar(10) COLLATE "pg_catalog"."default" DEFAULT 'epub'::character varying,
                                  CONSTRAINT "books_pkey" PRIMARY KEY ("id"),
                                  CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."books"
    OWNER TO "postgres";

CREATE TABLE "public"."comments" (
                                     "id" int8 NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
                                     "user_id" int8 NOT NULL,
                                     "entry_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                     "content" text COLLATE "pg_catalog"."default" NOT NULL,
                                     "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                     "parent_id" int8,
                                     CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
                                     CONSTRAINT "comments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."diary_entries" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "fk_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."comments" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."comments"
    OWNER TO "postgres";

CREATE TABLE "public"."diary_entries" (
                                          "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                          "user_id" int8 NOT NULL,
                                          "title" varchar(255) COLLATE "pg_catalog"."default",
                                          "content" text COLLATE "pg_catalog"."default",
                                          "date" date,
                                          "tags" text[] COLLATE "pg_catalog"."default",
                                          "mood" varchar(50) COLLATE "pg_catalog"."default",
                                          "privacy" varchar(20) COLLATE "pg_catalog"."default",
                                          "deleted" bool DEFAULT false,
                                          "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                          "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                          "is_story" bool,
                                          "folder_id" varchar(255) COLLATE "pg_catalog"."default",
                                          CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id"),
                                          CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                          CONSTRAINT "fk_diary_entries_folder" FOREIGN KEY ("folder_id") REFERENCES "public"."folders" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."diary_entries"
    OWNER TO "postgres";

CREATE TABLE "public"."folders" (
                                    "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                    "user_id" int8 NOT NULL,
                                    "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                    "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                    CONSTRAINT "folders_pkey" PRIMARY KEY ("id"),
                                    CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."folders"
    OWNER TO "postgres";

CREATE TABLE "public"."likes" (
                                  "user_id" int8 NOT NULL,
                                  "entry_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                  CONSTRAINT "likes_pkey" PRIMARY KEY ("user_id", "entry_id"),
                                  CONSTRAINT "likes_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."diary_entries" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                  CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
;

ALTER TABLE "public"."likes"
    OWNER TO "postgres";

CREATE TABLE "public"."mindmaps" (
                                     "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                     "user_id" int8 NOT NULL,
                                     "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                     "content" text COLLATE "pg_catalog"."default",
                                     "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                     "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT "mindmaps_pkey" PRIMARY KEY ("id")
)
;

ALTER TABLE "public"."mindmaps"
    OWNER TO "postgres";

CREATE TABLE "public"."users" (
                                  "id" int8 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
                                  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
                                  "name" varchar(255) COLLATE "pg_catalog"."default",
                                  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
                                  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
                                  CONSTRAINT "users_email_key" UNIQUE ("email")
)
;

ALTER TABLE "public"."users"
    OWNER TO "postgres";

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