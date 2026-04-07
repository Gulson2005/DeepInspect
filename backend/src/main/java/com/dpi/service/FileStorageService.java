package com.dpi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${dpi.storage.upload:./storage/uploads/}")
    private String uploadDir;

    public Path save(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path destination = uploadPath.resolve(uniqueName);
            file.transferTo(destination);
            return destination;

        } catch (IOException e) {
            throw new com.dpi.exception.StorageException("Failed to save uploaded file: " + e.getMessage());
        }
    }

    public void delete(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {}
    }
}
