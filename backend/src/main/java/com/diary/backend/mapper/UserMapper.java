package com.diary.backend.mapper;

import com.diary.backend.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE email = #{email}")
    User findByEmail(String email);

    @Insert("INSERT INTO users(email, password, name, created_at) VALUES(#{email}, #{password}, #{name}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(User user);

    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);

    @org.apache.ibatis.annotations.Update("UPDATE users SET name = #{name}, email = #{email} WHERE id = #{id}")
    void updateProfile(User user);

    @org.apache.ibatis.annotations.Update("UPDATE users SET password = #{password} WHERE id = #{id}")
    void updatePassword(User user);
}
