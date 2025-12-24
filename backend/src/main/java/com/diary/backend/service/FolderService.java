package com.diary.backend.service;

import com.diary.backend.common.Result;
import com.diary.backend.entity.Folder;
import com.diary.backend.mapper.FolderMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class FolderService {

    @Autowired
    private FolderMapper folderMapper;

    @Autowired
    private UserService userService;

    public Result<List<Folder>> getUserFolders(Long userId) {
        return Result.success(folderMapper.findByUserId(userId));
    }

    public Result<Folder> createFolder(Long userId, String name) {
        Folder folder = new Folder();
        folder.setId(UUID.randomUUID().toString());
        folder.setUserId(userId);
        folder.setName(name);

        folderMapper.insert(folder);
        return Result.success(folder);
    }

    public Result<Void> updateFolder(Long userId, String id, String name) {
        Folder folder = folderMapper.findById(id);
        if (folder == null) {
            return Result.error(404, "Folder not found");
        }
        if (!folder.getUserId().equals(userId)) {
            return Result.error(403, "Unauthorized");
        }

        folder.setName(name);
        folderMapper.update(folder);
        return Result.success(null);
    }

    public Result<Void> deleteFolder(Long userId, String id) {
        Folder folder = folderMapper.findById(id);
        if (folder == null) {
            return Result.error(404, "Folder not found");
        }
        if (!folder.getUserId().equals(userId)) {
            return Result.error(403, "Unauthorized");
        }

        // Note: Database foreign key is set to ON DELETE SET NULL, so entries will be unassigned automatically
        folderMapper.delete(id);
        return Result.success(null);
    }
}
