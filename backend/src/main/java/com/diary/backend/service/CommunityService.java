package com.diary.backend.service;

import com.diary.backend.dto.CommunityEntryDTO;
import com.diary.backend.entity.Comment;
import com.diary.backend.entity.DiaryEntry;
import com.diary.backend.mapper.CommunityMapper;
import com.diary.backend.mapper.DiaryEntryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommunityService {

    @Autowired
    private CommunityMapper communityMapper;

    @Autowired
    private DiaryEntryMapper diaryEntryMapper;

    public List<CommunityEntryDTO> getSharedEntries(Long currentUserId) {
        return communityMapper.findSharedEntries(currentUserId);
    }

    @Transactional
    public void likeEntry(Long userId, String entryId) {
        DiaryEntry entry = diaryEntryMapper.findById(entryId);
        if (entry == null) {
            throw new RuntimeException("Entry not found");
        }
        if (Boolean.TRUE.equals(entry.getIsStory())) {
            throw new RuntimeException("Cannot like a daily story. Please vote instead.");
        }
        communityMapper.likeEntry(userId, entryId);
    }

    @Transactional
    public void unlikeEntry(Long userId, String entryId) {
        communityMapper.unlikeEntry(userId, entryId);
    }

    @Transactional
    public void voteEntry(Long userId, String entryId) {
        DiaryEntry entry = diaryEntryMapper.findById(entryId);
        if (entry == null) {
            throw new RuntimeException("Entry not found");
        }
        if (!Boolean.TRUE.equals(entry.getIsStory())) {
            throw new RuntimeException("Cannot vote for a non-story entry. Please like instead.");
        }
        communityMapper.voteEntry(userId, entryId);
    }

    @Transactional
    public void unvoteEntry(Long userId, String entryId) {
        communityMapper.unvoteEntry(userId, entryId);
    }

    @Transactional
    public Comment addComment(Long userId, String entryId, String content, Long parentId) {
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setEntryId(entryId);
        comment.setContent(content);
        comment.setParentId(parentId);
        communityMapper.addComment(comment);
        // Fetch back to get author name properly populated if needed, or just return basic
        // For simplicity, we assume frontend knows current user name or we re-fetch
        return comment; 
    }

    public List<Comment> getComments(String entryId) {
        return communityMapper.findComments(entryId);
    }

    public void deleteComment(Long commentId) {
        communityMapper.deleteComment(commentId);
    }
}
