package com.diary.backend.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
public class DiaryEntry {
    private String id;
    private Long userId;
    private String folderId;
    private String title;
    private String content;
    private LocalDate date;
    private String[] tags; // Using String[] mapped to Postgres text[]
    private String mood;
    private String privacy; // 'private' or 'shared'
    private Boolean isStory;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
