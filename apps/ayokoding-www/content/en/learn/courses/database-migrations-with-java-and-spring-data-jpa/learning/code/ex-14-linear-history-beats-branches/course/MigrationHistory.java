package course; // => every example class shares one package for scanning

// MigrationHistory is the migration ledger as a Spring Data JPA entity.
// One row per applied version pairs the schema change with its fingerprint,
// so reruns skip applied work and edits to applied files are detectable.
import jakarta.persistence.Column; // => maps a field to a history column
import jakarta.persistence.Entity; // => marks the history record persistent
import jakarta.persistence.Id; // => the version is the primary key
import jakarta.persistence.Table; // => pins the per-example history table

@Entity // => Spring Data JPA persists this through the repository
@Table(name = "ex14_history") // => per-example table keeps units isolated
public class MigrationHistory {

  // => the version is the primary key: one row per migration, applied once
  @Id // => one row per migration version, applied at most once
  @Column(name = "version", nullable = false) // => the V-file number, for example 001
  private String version; // => stored as text so prefixes sort correctly

  // => the description keeps history readable without opening files
  @Column(name = "description", nullable = false) // => the human half of the file name
  private String description; // => recorded for readable history output

  // => the checksum binds the ledger row to the exact applied bytes
  @Column(name = "checksum", nullable = false, length = 64) // => SHA-256 hex of the applied file
  private String checksum; // => reruns compare this to catch edited history

  protected MigrationHistory() {
    // => JPA needs a no-arg constructor
  }

  public MigrationHistory(String version, String description, String checksum) {
    // => the runner builds rows
    this.version = version; // => keeps the migration number
    this.description = description; // => keeps the readable name
    this.checksum = checksum; // => keeps the applied content fingerprint
  }

  public String getVersion() {
    // => lets verifications read the number
    return version; // => returns the stored version
  }

  public String getDescription() {
    // => lets verifications read the name
    return description; // => returns the stored description
  }

  public String getChecksum() {
    // => lets reruns compare fingerprints
    return checksum; // => returns the stored checksum
  }
}
