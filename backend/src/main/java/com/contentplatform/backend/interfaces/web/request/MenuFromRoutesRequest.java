package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class MenuFromRoutesRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String title;
    @NotNull
    private MenuLocation location;
    @NotBlank
    @Pattern(regexp = "^(fa|en|ar|zh|ru)$", message = "languageCode must be one of: fa, en, ar, zh, ru")
    private String languageCode;
    @NotNull
    private MenuStatus status;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public MenuLocation getLocation() { return location; }
    public void setLocation(MenuLocation location) { this.location = location; }
    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    public MenuStatus getStatus() { return status; }
    public void setStatus(MenuStatus status) { this.status = status; }
}
