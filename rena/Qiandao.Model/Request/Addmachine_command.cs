
namespace Qiandao.Model.Request
{
    public class Addmachine_command
    {
        public  int? Id { get; set; }

        public required string Serial { get; set; }

        public required string Name { get; set; }

        public string? Content { get; set; }

        public int? Status { get; set; }

        public int? Send_status { get; set; }

        public int? Err_count { get; set; }

        public DateTime? Run_time { get; set; }

        public DateTime? Gmt_crate { get; set; }

        public DateTime? Gmt_modified { get; set; }
    }
}
