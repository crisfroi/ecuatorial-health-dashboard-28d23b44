
namespace Qiandao.Model.Request
{
    public class Addenrollinfo
    {
        public  int? Id { get; set; }

        public required long Enroll_id { get; set; }

        public int? Backupnum { get; set; }

        public string? ImagePath { get; set; }

        public string? Signatures { get; set; }
    }
}
