namespace Qiandao.Web.WebSocketHandler
{
    public class LoggerProvider : ILoggerProvider
    {
        public ILogger CreateLogger(string categoryName)
        {
            return new LoggerFactory().CreateLogger(categoryName);
        }
        public ILogger<TCategoryName> CreateLogger<TCategoryName>()
        {
            return (ILogger<TCategoryName>)CreateLogger(typeof(TCategoryName).FullName);
        }
        public void Dispose()
        {
        }
    }
}
