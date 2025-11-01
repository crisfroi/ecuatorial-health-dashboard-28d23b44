
namespace Qiandao.Model.Request
{
    public class Addaccess_week
    {
        public  int? Id { get; set; }

        public  string? Serial { get; set; }

        public  string? Name { get; set; }

        public required int Monday { get; set; }

        public required int Tuesday { get; set; }

        public required int Wednesday { get; set; }

        public required int Thursday { get; set; }

        public required int Friday { get; set; }

        public required int Saturday { get; set; }

        public required int Sunday { get; set; }
    }
}
