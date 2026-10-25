package course; // => every example class shares one package for scanning

// JpaConfig wires one pooled DataSource, one Hibernate-backed
// EntityManagerFactory, and one transaction manager, then enables the
// Spring Data JPA repositories the runner uses as its migration ledger.
import com.zaxxer.hikari.HikariConfig; // => pooled connections for the context
import com.zaxxer.hikari.HikariDataSource; // => the DataSource Spring manages
import jakarta.persistence.EntityManagerFactory; // => created by the factory bean
import java.util.Properties; // => Hibernate settings without stringly XML
import javax.sql.DataSource; // => the handle every bean shares
import org.springframework.context.annotation.Bean; // => declares managed beans
import org.springframework.context.annotation.Configuration; // => marks the config class
import org.springframework.data.jpa.repository.config.EnableJpaRepositories; // => implements repositories
import org.springframework.orm.jpa.JpaTransactionManager; // => binds transactions to the EM
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean; // => builds the EM factory
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter; // => Hibernate as the provider
import org.springframework.transaction.PlatformTransactionManager; // => the transaction abstraction
import org.springframework.transaction.annotation.EnableTransactionManagement; // => enables @Transactional

@Configuration // => this class declares the beans below
@EnableJpaRepositories(basePackages = "course") // => repository interfaces gain implementations
@EnableTransactionManagement // => @Transactional works on managed beans
public class JpaConfig {

  // => one place reads the harness variables with local fallbacks
  static String env(String name, String fallback) {
    // => reads one variable or its default
    String override = System.getProperty(name.toLowerCase() + ".override"); // => promotion stages retarget per context
    if (override != null) {
      // => an explicit override always wins
      return override; // => lets one program migrate several databases in turn
    }
    String value = System.getenv(name); // => harness publishes PGHOST, PGUSER, PGDATABASE
    return value == null ? fallback : value; // => local runs fall back to defaults
  }

  @Bean(destroyMethod = "close") // => the pool closes when the context closes
  public DataSource dataSource() {
    // => the single connection source
    // => trust auth accepts any password, so only the user matters
    HikariConfig config = new HikariConfig(); // => pool settings holder
    String host = env("PGHOST", "localhost"); // => harness host or local default
    String port = env("PGPORT", "5432"); // => harness port or the local default
    String db = env("PGDATABASE", "postgres"); // => harness database or local default
    config.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + "/" + db); // => full JDBC address
    config.setUsername(env("PGUSER", "postgres")); // => the login the pool connects with
    config.setMaximumPoolSize(2); // => two connections serve every example
    return new HikariDataSource(config); // => the managed pool
  }

  @Bean // => the JPA entry point for repositories and transactions
  public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
    // => wires pool in
    // => migrations own the schema: Hibernate never creates or alters tables here
    LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean(); // => EM builder
    factory.setDataSource(dataSource); // => persistence runs on the pool
    factory.setPackagesToScan("course"); // => finds the @Entity classes
    factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter()); // => Hibernate implements JPA here
    Properties props = new Properties(); // => provider settings below
    props.setProperty("hibernate.hbm2ddl.auto", "none"); // => migrations own the schema, never Hibernate
    props.setProperty("hibernate.show_sql", "false"); // => SQL stays out of the golden output
    factory.setJpaProperties(props); // => applies the settings above
    return factory; // => Spring builds the EntityManagerFactory from this
  }

  @Bean // => repositories and runners join transactions through this
  public PlatformTransactionManager transactionManager(EntityManagerFactory factory) {
    // => wires EM factory in
    return new JpaTransactionManager(factory); // => JPA-aware transaction manager
  }
}
