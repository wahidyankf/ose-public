package com.organiclever.be.unit.steps;

import org.springframework.context.annotation.Import;

/**
 * Abstract base for unit Cucumber context configs. Not annotated with
 * {@code @CucumberContextConfiguration} — only the concrete per-domain subclasses are. Imports
 * {@link UnitServicesConfig} (services + mocked repos) so the full service stack is available in
 * Cucumber glue steps without MockMvc or a web application context.
 */
@Import({UnitServicesConfig.class})
public abstract class BaseUnitCucumberContextConfig {}
