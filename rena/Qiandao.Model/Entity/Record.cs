
namespace Qiandao.Model.Entity
{
    public class Record
    {
        public  int? Id { get; set; }

        public required long Enroll_id { get; set; }

        public DateTime? Records_time { get; set; }

        public int? Mode { get; set; }

        public int? IntOut { get; set; }

        public int? Event { get; set; }

        public string? Device_serial_num { get; set; }

        public double? Temperature { get; set; }

        public string? Image { get; set; }
    }
}
