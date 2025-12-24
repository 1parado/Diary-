package com.diary.backend.mapper;

import com.diary.backend.dto.CommunityEntryDTO;
import com.diary.backend.entity.Comment;
import org.apache.ibatis.annotations.*;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.type.ArrayTypeHandler;

import java.util.List;

@Mapper
public interface CommunityMapper {

    @Select("""
        SELECT e.*, u.name as author_name,
               (SELECT COUNT(*) FROM likes l WHERE l.entry_id = e.id) as like_count,
               (SELECT COUNT(*) FROM votes v WHERE v.entry_id = e.id) as vote_count,
               (SELECT COUNT(*) FROM comments c WHERE c.entry_id = e.id) as comment_count,
               CASE WHEN EXISTS (SELECT 1 FROM likes l2 WHERE l2.entry_id = e.id AND l2.user_id = #{currentUserId}) THEN TRUE ELSE FALSE END as is_liked,
               CASE WHEN EXISTS (SELECT 1 FROM votes v2 WHERE v2.entry_id = e.id AND v2.user_id = #{currentUserId}) THEN TRUE ELSE FALSE END as is_voted
        FROM diary_entries e
        JOIN users u ON e.user_id = u.id
        WHERE e.privacy = 'shared' AND (e.deleted = false OR e.deleted IS NULL)
        ORDER BY 
         -- CASE WHEN e.is_story = TRUE THEN 0 ELSE 1 END,  这里注释掉就不会让story优先排序了 而且按照投票数量和创建时间优先排序
            vote_count DESC, 
            e.created_at DESC
    """)
    @Results({
        @Result(property = "tags", column = "tags", typeHandler = ArrayTypeHandler.class),
        @Result(property = "authorName", column = "author_name"),
        @Result(property = "likeCount", column = "like_count"),
        @Result(property = "voteCount", column = "vote_count"),
        @Result(property = "commentCount", column = "comment_count"),
        @Result(property = "isLiked", column = "is_liked"),
        @Result(property = "isVoted", column = "is_voted"),
        @Result(property = "isStory", column = "is_story")
    })
    List<CommunityEntryDTO> findSharedEntries(Long currentUserId);

    @Insert("INSERT INTO likes(user_id, entry_id, created_at) VALUES(#{userId}, #{entryId}, NOW()) ON CONFLICT DO NOTHING")
    void likeEntry(@Param("userId") Long userId, @Param("entryId") String entryId);

    @Delete("DELETE FROM likes WHERE user_id = #{userId} AND entry_id = #{entryId}")
    void unlikeEntry(@Param("userId") Long userId, @Param("entryId") String entryId);

    @Insert("INSERT INTO votes(user_id, entry_id, created_at) VALUES(#{userId}, #{entryId}, NOW()) ON CONFLICT DO NOTHING")
    void voteEntry(@Param("userId") Long userId, @Param("entryId") String entryId);

    @Delete("DELETE FROM votes WHERE user_id = #{userId} AND entry_id = #{entryId}")
    void unvoteEntry(@Param("userId") Long userId, @Param("entryId") String entryId);

    @Insert("INSERT INTO comments(user_id, entry_id, parent_id, content, created_at) VALUES(#{userId}, #{entryId}, #{parentId}, #{content}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void addComment(Comment comment);

    @Select("""
        SELECT c.*, u.name as author_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.entry_id = #{entryId}
        ORDER BY c.created_at ASC
    """)
    @Results({
        @Result(property = "authorName", column = "author_name")
    })
    List<Comment> findComments(String entryId);

    // 数据库中的comment 的id是自增的不会重复 所以直接按照commentId进行删除即可 前端根据userId判断是否可以进行删除
    @Delete("DELETE FROM comments WHERE id = #{commentId}")
    void deleteComment(@Param("commentId") Long commentId);
}
