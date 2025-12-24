package com.diary.backend.mapper;

import com.diary.backend.entity.Book;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface BookMapper {
    @Select("SELECT id, user_id, title, author, cover_image, created_at, last_read_at, progress FROM books WHERE user_id = #{userId} ORDER BY created_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "title", column = "title"),
        @Result(property = "author", column = "author"),
        @Result(property = "coverImage", column = "cover_image"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "lastReadAt", column = "last_read_at"),
        @Result(property = "progress", column = "progress")
    })
    List<Book> findAllByUserId(Long userId);

    @Select("SELECT id, user_id, title, author, cover_image, created_at, last_read_at, progress FROM books WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "title", column = "title"),
        @Result(property = "author", column = "author"),
        @Result(property = "coverImage", column = "cover_image"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "lastReadAt", column = "last_read_at"),
        @Result(property = "progress", column = "progress")
    })
    Book findMetadataById(String id);

    @Select("SELECT * FROM books WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "title", column = "title"),
        @Result(property = "author", column = "author"),
        @Result(property = "coverImage", column = "cover_image"),
        @Result(property = "fileData", column = "file_data"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "lastReadAt", column = "last_read_at"),
        @Result(property = "progress", column = "progress")
    })
    Book findById(String id);

    @Insert("INSERT INTO books(id, user_id, title, author, cover_image, file_data, created_at) VALUES(#{id}, #{userId}, #{title}, #{author}, #{coverImage}, #{fileData}, NOW())")
    void insert(Book book);

    @Update("UPDATE books SET last_read_at = NOW(), progress = #{progress} WHERE id = #{id}")
    void updateProgress(@Param("id") String id, @Param("progress") String progress);

    @Delete("DELETE FROM books WHERE id = #{id}")
    void deleteById(String id);
}
