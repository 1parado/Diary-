package com.diary.backend.dto;

import lombok.Data;

@Data
public class UpdatePasswordRequest {
    private Long userId;
    private String currentPassword;
    private String newPassword;
}
