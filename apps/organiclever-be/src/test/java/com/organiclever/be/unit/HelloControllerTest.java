package com.organiclever.be.unit;

import com.organiclever.be.controller.HelloController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HelloControllerTest {

    private final HelloController controller = new HelloController();

    @Test
    void hello_returnsExactlyOneEntry() {
        final Map<String, String> result = controller.hello();
        assertThat(result).hasSize(1);
    }
}
