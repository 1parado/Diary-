package com.diary.backend.mapper;

import com.diary.backend.entity.DiaryEntry;
import org.apache.ibatis.annotations.*;
import org.apache.ibatis.type.ArrayTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.util.List;

@Mapper
public interface DiaryEntryMapper {

    @Select("SELECT * FROM diary_entries WHERE user_id = #{userId} AND (deleted = false OR deleted IS NULL) ORDER BY date DESC")
    @Results({
        @Result(property = "tags", column = "tags", typeHandler = ArrayTypeHandler.class)
    })
    List<DiaryEntry> findByUserId(Long userId);

    @Select("SELECT * FROM diary_entries WHERE id = #{id} ")
    @Results({
        @Result(property = "tags", column = "tags", typeHandler = ArrayTypeHandler.class)
    })
    DiaryEntry findById(String id);

    @Insert("INSERT INTO diary_entries(id, user_id, folder_id, title, content, date, tags, mood, privacy, is_story, deleted, created_at, updated_at) " +
            "VALUES(#{id}, #{userId}, #{folderId}, #{title}, #{content}, #{date}, #{tags, typeHandler=org.apache.ibatis.type.ArrayTypeHandler}, #{mood}, #{privacy}, #{isStory}, #{deleted}, NOW(), NOW())")
    void insert(DiaryEntry entry);

    @Update("UPDATE diary_entries SET folder_id=#{folderId}, title=#{title}, content=#{content}, date=#{date}, " +
            "tags=#{tags, typeHandler=org.apache.ibatis.type.ArrayTypeHandler}, mood=#{mood}, privacy=#{privacy}, is_story=#{isStory}, updated_at=NOW() " +
            "WHERE id=#{id}")
    void update(DiaryEntry entry);

    @Update("UPDATE diary_entries SET folder_id = #{folderId}, updated_at = NOW() WHERE id = #{id}")
    void updateFolder(@Param("id") String id, @Param("folderId") String folderId);

    @Update("UPDATE diary_entries SET deleted=true WHERE id=#{id}")
    void softDelete(String id);

    @Update("UPDATE diary_entries SET deleted=false WHERE id=#{id}")
    void restore(String id);

    @Delete("DELETE FROM diary_entries WHERE id=#{id}")
    void deletePermanently(String id);
    
    @Select("SELECT * FROM diary_entries WHERE user_id = #{userId} AND deleted = true ORDER BY updated_at DESC")
    @Results({
        @Result(property = "tags", column = "tags", typeHandler = ArrayTypeHandler.class)
    })
    List<DiaryEntry> findDeletedByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM diary_entries WHERE user_id = #{userId} AND date = #{date} AND is_story = true AND (deleted = false OR deleted IS NULL) AND id != #{excludeId}")
    int countStoriesByDate(@Param("userId") Long userId, @Param("date") java.time.LocalDate date, @Param("excludeId") String excludeId);
}
