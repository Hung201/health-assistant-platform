CREATE TABLE IF NOT EXISTS live_stream_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    live_stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'visible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_live_stream_comments_status CHECK (status IN ('visible', 'hidden'))
);

CREATE INDEX IF NOT EXISTS idx_live_stream_comments_stream_created
    ON live_stream_comments(live_stream_id, created_at DESC);
