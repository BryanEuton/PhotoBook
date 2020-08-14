using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Structure;
using Microsoft.Extensions.Configuration;
using PhotoBook.ImageProcessing.Interfaces;
using NLog;
using PhotoBook.Base;
using PhotoBook.DataManager.Models;

namespace PhotoBook.ImageProcessing
{
    public class FacialRecognition : IDisposable
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public static Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly bool _writeImagesToLocal;
        private readonly string _imagesToLocalPath;
        private readonly string _haarPath;
        private readonly IConfiguration _configuration;
        private EigenFaceRecognizer Recognizer { get;}
        private const string HaarCascade = "haarcascade_frontalface_default.xml";
        public const string HaarCascadeSideProfile = "haarcascade_profileface.xml";
        private Dictionary<int, long> LabelDictionary { get; }
        public FacialRecognition(IConfiguration configuration, List<Face> trainingFaces)
        {
            _imagesToLocalPath = configuration["ImageProcessing:FacesToLocalPath"];
            _writeImagesToLocal = bool.Parse(configuration["ImageProcessing:WriteFacesToLocal"] ?? "false") && !string.IsNullOrEmpty(_imagesToLocalPath) && Directory.Exists(_imagesToLocalPath);
            _haarPath = configuration["ImageProcessing:HaarFolder"] ?? Path.Combine(AppContext.BaseDirectory, "haar");
            _configuration = configuration;
            LabelDictionary = new Dictionary<int, long>();
            var trainingImages = new List<Image<Gray, byte>>();
            var labels = new List<int>();
            var tempDictionary = new Dictionary<long, int>();


            if (!trainingFaces.Any(tf=> tf.TagId.HasValue))
            {
                return;
            }
            foreach (var face in trainingFaces)
            {
                if (face.TagId.HasValue)
                {
                    trainingImages.Add(new Image<Gray, byte>(ByteArrayToBitmap(face.Bytes)).Resize(100, 100, Inter.Cubic));
                    if (!tempDictionary.ContainsKey(face.TagId.Value))
                    {
                        var idx = tempDictionary.Count + 1;
                        tempDictionary.Add(face.TagId.Value, idx);
                        LabelDictionary.Add(idx, face.TagId.Value);
                    }
                    labels.Add(tempDictionary[face.TagId.Value]);
                }
                //Logger.Trace($"Adding training image {face.Name}");
            }

            Logger.Trace($"Using {trainingImages.Count} training images.");
                
            Recognizer = new EigenFaceRecognizer(80, double.PositiveInfinity);
            Recognizer.Train(trainingImages.ToArray(), labels.ToArray());

            foreach (var img in trainingImages)
            {
                img.Dispose();
            }
        }

        public List<Face> Recognize(List<Rectangle> knownRectangles, MemoryStream ms, string haarCascade = null)
        {
            return Recognize(knownRectangles, new Bitmap(ms), haarCascade);
        }
        public List<Face> Recognize(List<Rectangle> knownRectangles, Bitmap imageToRecognize, string haarCascade = null)
        {
            var people = new List<Face>();
            using (var classifier = new CascadeClassifier(Path.Combine(_haarPath, haarCascade ?? HaarCascade)))
            using(var faceDetector = new FaceDetection(_configuration, _writeImagesToLocal, _imagesToLocalPath, _haarPath))
            {
                var faceToRecognize = faceDetector.Detect(knownRectangles, imageToRecognize, classifier, haarCascade ?? HaarCascade);
                foreach (var face in faceToRecognize)
                {
                    face.DbFace.TagId = Constants.Tags.UnknownTagId;
                    if (Recognizer != null)
                    {
                        var result = Recognizer.Predict(face.Image.Convert<Gray, byte>());
                        if (LabelDictionary.ContainsKey(result.Label))
                        {
                            face.DbFace.TagId = LabelDictionary[result.Label];
                            face.DbFace.Distance = result.Distance;
                        }

                        if (face.DbFace.TagId != Constants.Tags.UnknownTagId)
                        {
                            Logger.Trace($"Found {face.DbFace.TagId} with distance {face.DbFace.Distance}!");
                        }
                    }
                    if (_writeImagesToLocal)
                    {

                        var faces = Path.Combine(_imagesToLocalPath, "Faces");
                        if (!Directory.Exists(faces))
                        {
                            Directory.CreateDirectory(faces);
                        }
                        face.Image.Save(Path.Combine(faces, $"{face.DbFace.TagId}_{Guid.NewGuid():N}.jpg"));
                    }
                    face.Image.Dispose();
                    people.Add(face.DbFace);
                }
            }

            return people;
        }

        public Face IdentifyFace(Face face)
        {
            if(Recognizer == null)
            {
                return null;
            }
            var image = new Image<Gray, byte>(ByteArrayToBitmap(face.Bytes));
            var result = Recognizer.Predict(image);
            if (LabelDictionary.ContainsKey(result.Label))
            {
                face.TagId = LabelDictionary[result.Label];
                face.Distance = result.Distance;
                return face;
            }
            return null;
        }
        public long? Recognize(byte[] bytes, out double distance)
        {
            using (var memoryStream = new MemoryStream(bytes))
            {
                return Recognize(memoryStream, out distance);
            }
        }
        public long? Recognize(MemoryStream ms, out double distance)
        {
            return Recognize(new Bitmap(ms), out distance);
        }

        public long? Recognize(Bitmap faceToRecognize, out double distance)
        {
            distance = -1;
            using (var image = new Image<Bgr, byte>(faceToRecognize))
            {
                var result = Recognizer.Predict(image.Convert<Gray, byte>());
                distance = result.Distance;
                if (LabelDictionary.ContainsKey(result.Label))
                {
                    return LabelDictionary[result.Label];
                }

                return null;
            }
        }

        private Bitmap ByteArrayToBitmap(byte[] byteArrayIn)
        {
            return new Bitmap(new MemoryStream(byteArrayIn));
        }

        public void Dispose()
        {
            Recognizer?.Dispose();
        }
    }
}
