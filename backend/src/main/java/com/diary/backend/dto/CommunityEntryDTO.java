package com.diary.backend.dto;

import com.diary.backend.entity.DiaryEntry;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CommunityEntryDTO extends DiaryEntry {
    private String authorName;
    private Integer likeCount;
    private Integer voteCount;
    private Integer commentCount;
    private Boolean isLiked; // Whether the current user liked it
    private Boolean isVoted; // Whether the current user voted for it
}
