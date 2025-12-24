package com.diary.backend.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Comment {
    private Long id;
    private Long userId;
    private String entryId;
    private Long parentId;
    private String content;
    private LocalDateTime createdAt;
    
    // Extra field for display
    private String authorName;
}
