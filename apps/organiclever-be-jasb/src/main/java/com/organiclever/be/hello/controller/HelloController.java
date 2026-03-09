package com.organiclever.be.hello.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** REST controller providing the hello endpoint. */
@RestController
@RequestMapping("/api/v1")
public final class HelloController {

    /**
     * Returns a greeting message.
     *
     * @return a map containing a greeting message
     */
    @GetMapping("/hello")
    public Map<String, String> hello() {
        return Map.of("message", "world!");
    }
}
