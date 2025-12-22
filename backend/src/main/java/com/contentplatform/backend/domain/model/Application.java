package com.contentplatform.backend.domain.model;

import java.util.Objects;

public class Application {
    private final String id;
    private final String name;

    public Application(String id, String name) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = Objects.requireNonNull(name, "name must not be null");
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
