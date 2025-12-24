package com.diary.backend.mapper;

import com.diary.backend.entity.BookNote;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface BookNoteMapper {
    @Select("SELECT * FROM book_notes WHERE book_id = #{bookId} AND user_id = #{userId} ORDER BY created_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "bookId", column = "book_id"),
        @Result(property = "cfiRange", column = "cfi_range"),
        @Result(property = "createdAt", column = "created_at")
    })
    List<BookNote> findByBookId(@Param("bookId") String bookId, @Param("userId") Long userId);

    @Insert("INSERT INTO book_notes(id, user_id, book_id, cfi_range, content, color, created_at) VALUES(#{id}, #{userId}, #{bookId}, #{cfiRange}, #{content}, #{color}, NOW())")
    void insert(BookNote note);

    @Delete("DELETE FROM book_notes WHERE id = #{id}")
    void deleteById(String id);
}
