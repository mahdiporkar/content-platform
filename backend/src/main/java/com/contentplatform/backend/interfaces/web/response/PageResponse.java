package com.contentplatform.backend.interfaces.web.response;

import java.util.List;

public class PageResponse<T> {
    private final List<T> items;
    private final long totalElements;
    private final int totalPages;
    private final int page;
    private final int size;

    public PageResponse(List<T> items, long totalElements, int totalPages, int page, int size) {
        this.items = items;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.page = page;
        this.size = size;
    }

    public List<T> getItems() {
        return items;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }
}
