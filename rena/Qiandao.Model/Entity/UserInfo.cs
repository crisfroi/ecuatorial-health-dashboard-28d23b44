
namespace Qiandao.Model.Entity
{
    public class UserInfo
    {

        public  long? EnrollId { get; set; }

        public required string Name { get; set; }

        public int? Backupnum { get; set; }

        public int? Admin { get; set; }

        public string? ImagePath { get; set; }

        public string? Record { get; set; }

    }
}
