using Emgu.CV;
using Emgu.CV.Structure;

namespace PhotoBook.ImageProcessing.Models
{
    public class Face
    {
        public DataManager.Models.Face DbFace { get; set; }
        public Image<Gray, byte> Image { get; set; }
    }
}
