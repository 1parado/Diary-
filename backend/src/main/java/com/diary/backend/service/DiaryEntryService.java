package com.diary.backend.service;

import com.diary.backend.entity.DiaryEntry;
import com.diary.backend.mapper.DiaryEntryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DiaryEntryService {

    @Autowired
    private DiaryEntryMapper diaryEntryMapper;

    public List<DiaryEntry> getEntries(Long userId) {
        return diaryEntryMapper.findByUserId(userId);
    }

    public DiaryEntry getEntry(String id) {
        return diaryEntryMapper.findById(id);
    }

    @Transactional
    public void createEntry(DiaryEntry entry) {
        if (entry.getIsStory() == null) {
            entry.setIsStory(false);
        }
        // Check story limit
        if (Boolean.TRUE.equals(entry.getIsStory())) {
            int count = diaryEntryMapper.countStoriesByDate(entry.getUserId(), entry.getDate(), "");
            if (count > 0) {
                throw new RuntimeException("You can only post one daily story per day.");
            }
        }

        // Generate a random ID if it's not already set
        if (entry.getId() == null) {
            entry.setId(UUID.randomUUID().toString());
        }
        diaryEntryMapper.insert(entry);
    }

    @Transactional
    public void updateEntry(DiaryEntry entry) {
        if (entry.getIsStory() == null) {
            entry.setIsStory(false);
        }
        // Check story limit
        if (Boolean.TRUE.equals(entry.getIsStory())) {
            int count = diaryEntryMapper.countStoriesByDate(entry.getUserId(), entry.getDate(), entry.getId());
            if (count > 0) {
                throw new RuntimeException("You can only post one daily story per day.");
            }
        }
        diaryEntryMapper.update(entry);
    }

    @Transactional
    public void deleteEntry(String id) {
        diaryEntryMapper.softDelete(id);
    }

    @Transactional
    public void restoreEntry(String id) {
        diaryEntryMapper.restore(id);
    }

    @Transactional
    public void permanentlyDeleteEntry(String id) {
        diaryEntryMapper.deletePermanently(id);
    }
    
    public List<DiaryEntry> getTrash(Long userId) {
        return diaryEntryMapper.findDeletedByUserId(userId);
    }

    @Transactional
    public void moveEntryToFolder(String entryId, String folderId, Long userId) {
        DiaryEntry entry = diaryEntryMapper.findById(entryId);
        if (entry == null) {
            throw new RuntimeException("Entry not found");
        }
        if (!entry.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        diaryEntryMapper.updateFolder(entryId, folderId);
    }
}
