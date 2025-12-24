package com.diary.backend.mapper;

import com.diary.backend.entity.Folder;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FolderMapper {

    @Select("SELECT * FROM folders WHERE user_id = #{userId} ORDER BY created_at ASC")
    List<Folder> findByUserId(Long userId);

    @Select("SELECT * FROM folders WHERE id = #{id}")
    Folder findById(String id);

    @Insert("INSERT INTO folders(id, user_id, name, created_at) VALUES(#{id}, #{userId}, #{name}, NOW())")
    void insert(Folder folder);

    @Update("UPDATE folders SET name = #{name} WHERE id = #{id}")
    void update(Folder folder);

    @Delete("DELETE FROM folders WHERE id = #{id}")
    void delete(String id);
}
