package com.diary.backend.service;

import com.diary.backend.dto.LoginRequest;
import com.diary.backend.dto.RegisterRequest;
import com.diary.backend.entity.User;
import com.diary.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.diary.backend.dto.UpdatePasswordRequest;
import com.diary.backend.dto.UpdateProfileRequest;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public User login(LoginRequest request) {
        User user = userMapper.findByEmail(request.getEmail());
        if (user != null && user.getPassword().equals(request.getPassword())) {
            return user;
        }
        return null;
    }

    @Transactional
    public User register(RegisterRequest request) {
        User existing = userMapper.findByEmail(request.getEmail());
        if (existing != null) {
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // In production, use hashing!
        user.setName(request.getName());
        userMapper.insert(user);
        return user;
    }

    @Transactional
    public User updateProfile(UpdateProfileRequest request) {
        User user = userMapper.findById(request.getId());
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        // Check if email is taken by another user
        User existingEmail = userMapper.findByEmail(request.getEmail());
        if (existingEmail != null && !existingEmail.getId().equals(user.getId())) {
            throw new RuntimeException("Email already in use");
        }
        
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        userMapper.updateProfile(user);
        return user;
    }

    @Transactional
    public void updatePassword(UpdatePasswordRequest request) {
        User user = userMapper.findById(request.getUserId());
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (!user.getPassword().equals(request.getCurrentPassword())) {
            throw new RuntimeException("Incorrect current password");
        }
        user.setPassword(request.getNewPassword());
        userMapper.updatePassword(user);
    }
}
