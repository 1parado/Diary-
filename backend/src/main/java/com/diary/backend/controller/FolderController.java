package com.diary.backend.controller;

import com.diary.backend.common.Result;
import com.diary.backend.entity.Folder;
import com.diary.backend.service.FolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    @Autowired
    private FolderService folderService;

    @GetMapping
    public Result<List<Folder>> getUserFolders(@RequestParam Long userId) {
        return folderService.getUserFolders(userId);
    }

    @PostMapping
    public Result<Folder> createFolder(@RequestBody Map<String, Object> payload) {
        Object userIdObj = payload.get("userId");
        String name = (String) payload.get("name");
        
        if (userIdObj == null) {
            return Result.error(400, "User ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            return Result.error(400, "Folder name is required");
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        return folderService.createFolder(userId, name);
    }

    @PutMapping("/{id}")
    public Result<Void> updateFolder(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        Object userIdObj = payload.get("userId");
        String name = (String) payload.get("name");
        
        if (userIdObj == null) {
            return Result.error(400, "User ID is required");
        }
        if (name == null || name.trim().isEmpty()) {
            return Result.error(400, "Folder name is required");
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        return folderService.updateFolder(userId, id, name);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteFolder(@PathVariable String id, @RequestParam Long userId) {
        return folderService.deleteFolder(userId, id);
    }
}
