package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.exception.NotFoundException;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.GetObjectResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/media")
public class PublicMediaGatewayController {
    private final MinioClient minioClient;
    private final String bucket;

    public PublicMediaGatewayController(MinioClient minioClient,
                                        @Value("${minio.bucket}") String bucket) {
        this.minioClient = minioClient;
        this.bucket = bucket;
    }

    @GetMapping("/{applicationId}/{*objectPath}")
    public ResponseEntity<StreamingResponseBody> getMedia(@PathVariable String applicationId,
                                                          @PathVariable String objectPath) {
        String normalizedPath = objectPath.startsWith("/") ? objectPath.substring(1) : objectPath;
        String objectKey = applicationId + "/" + normalizedPath;
        try {
            StatObjectResponse stat = minioClient.statObject(
                StatObjectArgs.builder().bucket(bucket).object(objectKey).build()
            );
            GetObjectResponse object = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(objectKey).build()
            );
            StreamingResponseBody body = outputStream -> {
                try (object) {
                    object.transferTo(outputStream);
                }
            };
            MediaType mediaType = parseMediaType(stat.contentType());
            return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(stat.size())
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .body(body);
        } catch (Exception ex) {
            throw new NotFoundException("Media not found");
        }
    }

    private MediaType parseMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException ignored) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
