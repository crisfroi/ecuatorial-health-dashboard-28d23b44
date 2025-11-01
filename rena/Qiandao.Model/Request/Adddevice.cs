
namespace Qiandao.Model.Request
{
    public class Adddevice
    {
        public required int Id { get; set; }

        public required string Serial_num { get; set; }

        public required int Status { get; set; }
    }
}
