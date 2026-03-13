package com.organiclever.be.unit.token_management;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

/**
 * Unit test runner for the TokenManagement feature.
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("token-management/tokens.feature")
@ConfigurationParameter(
        key = GLUE_PROPERTY_NAME,
        value = "com.organiclever.be.unit.token_management"
                + ",com.organiclever.be.unit.steps")
@ConfigurationParameter(
        key = PLUGIN_PROPERTY_NAME,
        value = "pretty,html:target/cucumber-reports/unit-token-management.html")
public class TokenManagementUnitTest {}
