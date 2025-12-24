package com.diary.backend.service;

import com.diary.backend.entity.MindMap;
import com.diary.backend.mapper.MindMapMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class MindMapService {

    @Autowired
    private MindMapMapper mindMapMapper;

    public List<MindMap> getMindMaps(Long userId) {
        return mindMapMapper.findAllByUserId(userId);
    }

    public MindMap getMindMap(String id) {
        return mindMapMapper.findById(id);
    }

    public MindMap createMindMap(Long userId, String title, String content) {
        MindMap mindMap = new MindMap();
        mindMap.setId(UUID.randomUUID().toString());
        mindMap.setUserId(userId);
        mindMap.setTitle(title);
        mindMap.setContent(content);
        mindMapMapper.insert(mindMap);
        return mindMap;
    }

    public void updateMindMap(String id, String title, String content) {
        MindMap mindMap = mindMapMapper.findById(id);
        if (mindMap != null) {
            mindMap.setTitle(title);
            mindMap.setContent(content);
            mindMapMapper.update(mindMap);
        }
    }

    public void deleteMindMap(String id) {
        mindMapMapper.deleteById(id);
    }
}
