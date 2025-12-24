package com.diary.backend.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Folder {
    private String id;
    private Long userId;
    private String name;
    private LocalDateTime createdAt;
}
