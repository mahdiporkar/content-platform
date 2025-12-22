package com.contentplatform.backend.application.port.out;

import java.time.Instant;

public record PageSlice<T>(java.util.List<T> items, long totalElements, int totalPages, int page, int size) {
}
