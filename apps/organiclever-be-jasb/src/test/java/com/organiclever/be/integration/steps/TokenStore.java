package com.organiclever.be.integration.steps;

import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("cucumber-glue")
public class TokenStore {

    @Nullable
    private String token;

    public void setToken(final String token) {
        this.token = token;
    }

    @Nullable
    public String getToken() {
        return token;
    }

    public void clear() {
        this.token = null;
    }
}
