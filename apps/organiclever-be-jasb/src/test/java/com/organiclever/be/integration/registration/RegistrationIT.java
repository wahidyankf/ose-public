package com.organiclever.be.integration.registration;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("auth/register.feature")
@ConfigurationParameter(
    key = GLUE_PROPERTY_NAME,
    value = "com.organiclever.be.integration.registration"
        + ",com.organiclever.be.integration.steps")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value = "pretty,html:target/cucumber-reports/registration.html")
public class RegistrationIT {}
