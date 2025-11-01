
namespace Qiandao.Model.Request
{
    public class Addperson
    {
        public  long? Id { get; set; }

        public required string Name { get; set; }

        public required int Roll_id { get; set; }
    }
}
