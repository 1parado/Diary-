package com.diary.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private Long id;
    private String name;
    private String email;
}
