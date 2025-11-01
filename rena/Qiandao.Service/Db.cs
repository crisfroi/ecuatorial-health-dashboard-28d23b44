using Microsoft.EntityFrameworkCore;
using Qiandao.Model.Entity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Qiandao.Service
{
    public class Db:DbContext
    {
        public Db(DbContextOptions<Db> options):base(options)
        { }


        public virtual DbSet<Access_day> access_day { get; set; }
        public virtual DbSet<Access_week> access_week { get; set; }
        public virtual DbSet<Device> device { get; set; }
        public virtual DbSet<Enrollinfo> enrollinfo { get; set; }
        public virtual DbSet<Person> person { get; set; }
        public virtual DbSet<Record> record { get; set; }
        public virtual DbSet<Machine_command> machine_command { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure table names to match database schema
            modelBuilder.Entity<Access_day>().ToTable("access_day");
            modelBuilder.Entity<Access_week>().ToTable("access_week");
            modelBuilder.Entity<Device>().ToTable("device");
            modelBuilder.Entity<Enrollinfo>().ToTable("enrollinfo");
            modelBuilder.Entity<Person>().ToTable("person");
            modelBuilder.Entity<Record>().ToTable("record");
            modelBuilder.Entity<Machine_command>().ToTable("machine_command");
        }

    }
}
