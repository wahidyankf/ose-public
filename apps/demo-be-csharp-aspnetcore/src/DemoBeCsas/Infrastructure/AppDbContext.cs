using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace DemoBeCsas.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserModel> Users => Set<UserModel>();
    public DbSet<ExpenseModel> Expenses => Set<ExpenseModel>();
    public DbSet<AttachmentModel> Attachments => Set<AttachmentModel>();
    public DbSet<RevokedTokenModel> RevokedTokens => Set<RevokedTokenModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.DisplayName).HasMaxLength(255).HasDefaultValue("");
            entity.Property(e => e.CreatedBy).HasMaxLength(255).HasDefaultValue("system");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255).HasDefaultValue("system");
            entity.Property(e => e.DeletedBy).HasMaxLength(255);
            entity.Property(e => e.PasswordResetToken).HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<UserStatus>(v, ignoreCase: true)
            );
            entity.Property(e => e.Role).HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<Role>(v, ignoreCase: true)
            );
        });

        modelBuilder.Entity<ExpenseModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(19, 4);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Currency).HasMaxLength(10);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.CreatedBy).HasMaxLength(255).HasDefaultValue("system");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255).HasDefaultValue("system");
            entity.Property(e => e.DeletedBy).HasMaxLength(255);
            entity.Property(e => e.Type).HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<ExpenseType>(v, ignoreCase: true)
            );
        });

        modelBuilder.Entity<AttachmentModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Filename).HasMaxLength(500);
            entity.Property(e => e.ContentType).HasMaxLength(100);
            entity.HasOne<ExpenseModel>()
                .WithMany()
                .HasForeignKey(e => e.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_attachments_expenses_expense_id");
        });

        modelBuilder.Entity<RevokedTokenModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Jti).IsUnique();
            entity.HasIndex(e => e.UserId);
        });
    }
}
