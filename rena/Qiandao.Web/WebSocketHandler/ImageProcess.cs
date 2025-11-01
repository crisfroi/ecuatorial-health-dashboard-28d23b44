using System.Drawing;
using System.Drawing.Imaging;

namespace Qiandao.Web.WebSocketHandler
{
    public static class ImageProcess
    {
        /// <summary>
        /// 将 Base64 字符串转换为图像文件
        /// </summary>
        /// <param name="base64">Base64 编码的图像字符串</param>
        /// <param name="fileName">保存的文件名</param>
        /// <returns>是否成功转换并保存</returns>
        public static bool Base64ToImage(string base64, string fileName)
        {
            try
            {
                // 将 Base64 字符串转换为字节数组
                byte[] imageData = Convert.FromBase64String(base64);

                // 创建一个内存流
                using (MemoryStream ms = new MemoryStream(imageData))
                {
                    // 使用内存流创建一个图像对象
                    Image image = Image.FromStream(ms);
                    // 保存图像到指定路径
                    image.Save("wwwroot/images/tmp/"+fileName, ImageFormat.Jpeg);
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error converting Base64 to image: {ex.Message}");
                return false;
            }
        }
    }
}
