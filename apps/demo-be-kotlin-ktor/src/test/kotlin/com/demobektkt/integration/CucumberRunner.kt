package com.demobektkt.integration

import io.cucumber.junit.platform.engine.Constants
import org.junit.jupiter.api.Tag
import org.junit.platform.suite.api.ConfigurationParameter
import org.junit.platform.suite.api.IncludeEngines
import org.junit.platform.suite.api.SelectClasspathResource
import org.junit.platform.suite.api.Suite

@Tag("integration")
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("specs/apps/demo/be/gherkin")
@ConfigurationParameter(key = Constants.PLUGIN_PROPERTY_NAME, value = "pretty")
@ConfigurationParameter(key = Constants.PLUGIN_PUBLISH_QUIET_PROPERTY_NAME, value = "true")
class CucumberRunner
