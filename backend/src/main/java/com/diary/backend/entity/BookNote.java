package com.diary.backend.entity;

import java.time.LocalDateTime;

public class BookNote {
    private String id;
    private Long userId;
    private String bookId;
    private String cfiRange;
    private String content;
    private String color;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getBookId() { return bookId; }
    public void setBookId(String bookId) { this.bookId = bookId; }
    public String getCfiRange() { return cfiRange; }
    public void setCfiRange(String cfiRange) { this.cfiRange = cfiRange; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
