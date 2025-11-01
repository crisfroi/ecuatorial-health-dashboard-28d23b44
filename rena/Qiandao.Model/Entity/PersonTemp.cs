
namespace Qiandao.Model.Entity
{
    public class PersonTemp
    {
 
        public required long UserId { get; set; }

        public required string Name { get; set; }

        public int? Privilege { get; set; }

        public string? ImagePath { get; set; }

        public string? Password { get; set; }

        public string? CardNum { get; set; }

        public override string ToString()
        {
            return $"PersonTemp [UserId={UserId}, Name={Name}, Privilege={Privilege}, ImagePath={ImagePath}, Password={Password}, CardNum={CardNum}]";
        }
    }
}
