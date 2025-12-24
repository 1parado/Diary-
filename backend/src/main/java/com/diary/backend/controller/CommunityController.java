package com.diary.backend.controller;

import com.diary.backend.common.Result;
import com.diary.backend.dto.CommunityEntryDTO;
import com.diary.backend.entity.Comment;
import com.diary.backend.service.CommunityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @GetMapping("/entries")
    public Result<List<CommunityEntryDTO>> getSharedEntries(@RequestParam Long userId) {
        return Result.success(communityService.getSharedEntries(userId));
    }

    @PostMapping("/entries/{id}/like")
    public Result<Void> likeEntry(@PathVariable String id, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) return Result.error(400, "User ID required");
        try {
            communityService.likeEntry(userId, id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/entries/{id}/like")
    public Result<Void> unlikeEntry(@PathVariable String id, @RequestParam Long userId) {
        communityService.unlikeEntry(userId, id);
        return Result.success();
    }

    @PostMapping("/entries/{id}/vote")
    public Result<Void> voteEntry(@PathVariable String id, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) return Result.error(400, "User ID required");
        try {
            communityService.voteEntry(userId, id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/entries/{id}/vote")
    public Result<Void> unvoteEntry(@PathVariable String id, @RequestParam Long userId) {
        communityService.unvoteEntry(userId, id);
        return Result.success();
    }

    @PostMapping("/entries/{id}/comments")
    public Result<Comment> addComment(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        String content = (String) payload.get("content");
        Long parentId = null;
        if (payload.get("parentId") != null) {
            parentId = ((Number) payload.get("parentId")).longValue();
        }

        if (userId == null || content == null) return Result.error(400, "User ID and content required");
        
        Comment comment = communityService.addComment(userId, id, content, parentId);
        return Result.success(comment);
    }

    @GetMapping("/entries/{id}/comments")
    public Result<List<Comment>> getComments(@PathVariable String id) {
        return Result.success(communityService.getComments(id));
    }

    // 删除某个笔记下的评论
    @DeleteMapping("/entries/{id}/comments/{commentId}")
    public Result<Void> deleteComment(@PathVariable String id, @PathVariable Long commentId) {
        communityService.deleteComment(commentId);
        return Result.success();
    }

}
