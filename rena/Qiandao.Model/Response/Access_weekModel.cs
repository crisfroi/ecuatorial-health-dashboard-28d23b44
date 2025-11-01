
namespace Qiandao.Model.Response
{
    public class Access_weekModel
    {
        public required int Id { get; set; }

        public required string Serial { get; set; }

        public required string Name { get; set; }

        public int? Monday { get; set; }

        public int? Tuesday { get; set; }

        public int? Wednesday { get; set; }

        public int? Thursday { get; set; }

        public int? Friday { get; set; }

        public int? Saturday { get; set; }

        public int? Sunday { get; set; }
    }
}
