package com.contentplatform.backend.domain.value;

public enum SystemPermission {
    APPLICATIONS_MANAGE("applications.manage"),
    USERS_MANAGE("users.manage");

    private final String wireValue;

    SystemPermission(String wireValue) {
        this.wireValue = wireValue;
    }

    public String wireValue() {
        return wireValue;
    }

    public static SystemPermission fromWireValue(String value) {
        for (SystemPermission permission : values()) {
            if (permission.name().equals(value) || permission.wireValue.equals(value)) {
                return permission;
            }
        }
        throw new IllegalArgumentException("Unknown system permission: " + value);
    }
}
