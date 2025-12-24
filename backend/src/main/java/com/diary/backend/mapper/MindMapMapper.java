package com.diary.backend.mapper;

import com.diary.backend.entity.MindMap;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface MindMapMapper {
    @Select("SELECT * FROM mindmaps WHERE user_id = #{userId} ORDER BY updated_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "title", column = "title"),
        @Result(property = "content", column = "content"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<MindMap> findAllByUserId(Long userId);

    @Select("SELECT * FROM mindmaps WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "title", column = "title"),
        @Result(property = "content", column = "content"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    MindMap findById(String id);

    @Insert("INSERT INTO mindmaps(id, user_id, title, content, created_at, updated_at) VALUES(#{id}, #{userId}, #{title}, #{content}, NOW(), NOW())")
    void insert(MindMap mindMap);

    @Update("UPDATE mindmaps SET title = #{title}, content = #{content}, updated_at = NOW() WHERE id = #{id}")
    void update(MindMap mindMap);

    @Delete("DELETE FROM mindmaps WHERE id = #{id}")
    void deleteById(String id);
}
