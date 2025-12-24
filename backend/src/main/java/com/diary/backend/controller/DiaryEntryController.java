package com.diary.backend.controller;

import com.diary.backend.common.Result;
import com.diary.backend.entity.DiaryEntry;
import com.diary.backend.service.DiaryEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entries")
public class DiaryEntryController {

    @Autowired
    private DiaryEntryService diaryEntryService;

    @GetMapping
    public Result<List<DiaryEntry>> getEntries(@RequestParam Long userId) {
        return Result.success(diaryEntryService.getEntries(userId));
    }

    @GetMapping("/{id}")
    public Result<DiaryEntry> getEntry(@PathVariable String id) {
        return Result.success(diaryEntryService.getEntry(id));
    }

    @PostMapping
    public Result<DiaryEntry> createEntry(@RequestBody DiaryEntry entry) {
        // Ensure userId is present. In a real app, get from Security Context.
        if (entry.getUserId() == null) {
             return Result.error(400, "User ID is required");
        }
        try {
            diaryEntryService.createEntry(entry);
            return Result.success(entry);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<Void> updateEntry(@PathVariable String id, @RequestBody DiaryEntry entry) {
        entry.setId(id);
        try {
            diaryEntryService.updateEntry(entry);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PutMapping("/{id}/folder")
    public Result<Void> moveEntryToFolder(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        String folderId = (String) payload.get("folderId");
        Object userIdObj = payload.get("userId");
        if (userIdObj == null) {
            return Result.error(400, "User ID is required");
        }
        Long userId = Long.valueOf(userIdObj.toString());
        
        try {
            diaryEntryService.moveEntryToFolder(id, folderId, userId);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteEntry(@PathVariable String id) {
        diaryEntryService.deleteEntry(id);
        return Result.success();
    }

    @PutMapping("/{id}/restore")
    public Result<Void> restoreEntry(@PathVariable String id) {
        diaryEntryService.restoreEntry(id);
        return Result.success();
    }

    @DeleteMapping("/{id}/permanent")
    public Result<Void> permanentlyDeleteEntry(@PathVariable String id) {
        diaryEntryService.permanentlyDeleteEntry(id);
        return Result.success();
    }
    
    @GetMapping("/trash")
    public Result<List<DiaryEntry>> getTrash(@RequestParam Long userId) {
        return Result.success(diaryEntryService.getTrash(userId));
    }
}
