package com.organiclever.be.auth.service;

public class InvalidCredentialsException extends Exception {
    public InvalidCredentialsException() {
        super("Invalid username or password");
    }
}
