using Microsoft.EntityFrameworkCore;
using Qiandao.Model.Entity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Qiandao.Service
{
    public class Db:DbContext
    {
        public Db(DbContextOptions options):base(options)
        { }

       
        public virtual DbSet<Access_day> access_day { get; set; }
        public virtual DbSet<Access_week> access_week { get; set; }
        public virtual DbSet<Device> device { get; set; }
        public virtual DbSet<Enrollinfo> enrollinfo { get; set; }
        public virtual DbSet<Person> person { get; set; }
        public virtual DbSet<Record> record { get; set; }
        public virtual DbSet<Machine_command> machine_command { get; set; }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Data Source=DESKTOP-OEN43E9;Initial Catalog=fingerprint;User Id=fingerprint;password=isa9822wangok...VV;Encrypt=True;TrustServerCertificate=True;");
            }
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }

    }
}
