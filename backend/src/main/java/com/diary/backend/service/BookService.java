package com.diary.backend.service;

import com.diary.backend.entity.Book;
import com.diary.backend.entity.BookNote;
import com.diary.backend.mapper.BookMapper;
import com.diary.backend.mapper.BookNoteMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class BookService {
    @Autowired
    private BookMapper bookMapper;
    
    @Autowired
    private BookNoteMapper bookNoteMapper;

    public List<Book> getBooks(Long userId) {
        return bookMapper.findAllByUserId(userId);
    }

    public Book getBook(String id) {
        return bookMapper.findById(id);
    }

    public Book getBookMetadata(String id) {
        return bookMapper.findMetadataById(id);
    }

    public void saveBook(Long userId, String title, String author, MultipartFile file, String coverImage) throws IOException {
        Book book = new Book();
        book.setId(UUID.randomUUID().toString());
        book.setUserId(userId);
        book.setTitle(title);
        book.setAuthor(author);
        book.setCoverImage(coverImage);
        book.setFileData(file.getBytes());
        bookMapper.insert(book);
    }

    public void deleteBook(String id) {
        bookMapper.deleteById(id);
    }

    public void updateProgress(String id, String progress) {
        bookMapper.updateProgress(id, progress);
    }

    public List<BookNote> getNotes(String bookId, Long userId) {
        return bookNoteMapper.findByBookId(bookId, userId);
    }

    public void addNote(Long userId, BookNote note) {
        note.setId(UUID.randomUUID().toString());
        note.setUserId(userId);
        bookNoteMapper.insert(note);
    }

    public void deleteNote(String id) {
        bookNoteMapper.deleteById(id);
    }
}
