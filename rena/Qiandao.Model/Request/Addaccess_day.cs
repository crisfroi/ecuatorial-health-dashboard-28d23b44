
namespace Qiandao.Model.Request
{
    public class Addaccess_day
    {
        public  int? Id { get; set; }

        public  string? Serial { get; set; }

        public  string? Name { get; set; }

        public required string startTime1 { get; set; }

        public required string endTime1 { get; set; }

        public required string startTime2 { get; set; }

        public required string endTime2 { get; set; }

        public required string startTime3 { get; set; }

        public required string endTime3 { get; set; }

        public required string startTime4 { get; set; }

        public required string endTime4 { get; set; }

        public required string startTime5 { get; set; }

        public required string endTime5 { get; set; }
    }
}
