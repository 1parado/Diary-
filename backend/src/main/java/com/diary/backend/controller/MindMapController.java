package com.diary.backend.controller;

import com.diary.backend.common.Result;
import com.diary.backend.entity.MindMap;
import com.diary.backend.service.MindMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mindmaps")
public class MindMapController {

    @Autowired
    private MindMapService mindMapService;

    @GetMapping
    public Result<List<MindMap>> getMindMaps(@RequestParam Long userId) {
        return Result.success(mindMapService.getMindMaps(userId));
    }

    @GetMapping("/{id}")
    public Result<MindMap> getMindMap(@PathVariable String id) {
        return Result.success(mindMapService.getMindMap(id));
    }

    @PostMapping
    public Result<MindMap> createMindMap(@RequestBody MindMap mindMap) {
        if (mindMap.getUserId() == null || mindMap.getTitle() == null) {
            return Result.error(400, "User ID and Title are required");
        }
        return Result.success(mindMapService.createMindMap(mindMap.getUserId(), mindMap.getTitle(), mindMap.getContent()));
    }

    @PutMapping("/{id}")
    public Result<Void> updateMindMap(@PathVariable String id, @RequestBody MindMap mindMap) {
        mindMapService.updateMindMap(id, mindMap.getTitle(), mindMap.getContent());
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteMindMap(@PathVariable String id) {
        mindMapService.deleteMindMap(id);
        return Result.success();
    }
}
