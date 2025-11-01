
namespace Qiandao.Model.Entity
{
    public class UserLock
    {
        public required int enrollId { get; set; }
        public required int weekZone { get; set; }
        public required int group { get; set; }

        public required string starttime { get; set; }
        public required string endtime { get; set; }
    }
}
