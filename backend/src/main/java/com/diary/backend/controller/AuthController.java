package com.diary.backend.controller;

import com.diary.backend.common.Result;
import com.diary.backend.dto.LoginRequest;
import com.diary.backend.dto.RegisterRequest;
import com.diary.backend.entity.User;
import com.diary.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.diary.backend.dto.UpdatePasswordRequest;
import com.diary.backend.dto.UpdateProfileRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<User> login(@RequestBody LoginRequest request) {
        User user = userService.login(request);
        if (user != null) {
            return Result.success(user);
        }
        return Result.error(401, "Invalid email or password");
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            return Result.success(user);
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PutMapping("/profile")
    public Result<User> updateProfile(@RequestBody UpdateProfileRequest request) {
        try {
            User user = userService.updateProfile(request);
            return Result.success(user);
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestBody UpdatePasswordRequest request) {
        try {
            userService.updatePassword(request);
            return Result.success();
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }
}
