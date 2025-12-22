package com.contentplatform.backend.application.dto;

public class PageRequest {
    private final int page;
    private final int size;

    public PageRequest(int page, int size) {
        this.page = Math.max(page, 0);
        this.size = Math.max(size, 1);
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }
}
