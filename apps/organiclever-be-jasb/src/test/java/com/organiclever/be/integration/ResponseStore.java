package com.organiclever.be.integration;

import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MvcResult;

@Component
@Scope("cucumber-glue")
public class ResponseStore {

    @Nullable
    private MvcResult result;

    public void setResult(final MvcResult result) {
        this.result = result;
    }

    public MvcResult getResult() {
        final MvcResult r = result;
        if (r == null) {
            throw new IllegalStateException(
                "No MvcResult stored. A When step must run before Then steps.");
        }
        return r;
    }

    public void clear() {
        this.result = null;
    }
}
