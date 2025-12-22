package com.contentplatform.backend.application.dto;

import java.util.List;

public class PageResult<T> {
    private final List<T> items;
    private final long totalElements;
    private final int totalPages;
    private final int page;
    private final int size;

    public PageResult(List<T> items, long totalElements, int totalPages, int page, int size) {
        this.items = List.copyOf(items);
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
