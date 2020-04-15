using System;
using System.Collections.Generic;
using System.Linq;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Structure;
using PhotoBook.ImageProcessing.Models;
using NLog;
using Microsoft.Extensions.Configuration;

namespace PhotoBook.ImageProcessing
{
    public class FaceDetection : IDisposable
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public static Logger Logger = LogManager.GetCurrentClassLogger();

        private bool writeImagesToLocal;
        private string imagesToLocalPath;
        private bool useAdditionalDetections;

        public CascadeClassifier EyeCascadeClassifier;
        public CascadeClassifier GlassesCascadeClassifier;
        public CascadeClassifier NoseCascadeClassifier;
        public CascadeClassifier MouthCascadeClassifier;
        public CascadeClassifier SmileCascadeClassifier;
        public CascadeClassifier EarCascadeClassifier;
        public CascadeClassifier RightEarCascadeClassifier;

        public FaceDetection(IConfiguration configuration, bool writeImagesToLocal, string imagesToLocalPath, string haarFolder)
        {
            this.writeImagesToLocal = writeImagesToLocal;
            this.imagesToLocalPath = imagesToLocalPath;

            useAdditionalDetections =
                bool.Parse(configuration["ImageProcessing:UseAdditionalDetectionsForFacialRecognition"] ?? "false");

            EyeCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_eye.xml"));
            GlassesCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_eye_tree_eyeglasses.xml"));
            NoseCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_mcs_nose.xml"));
            MouthCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_mcs_mouth.xml"));
            SmileCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_smile.xml"));
            EarCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_mcs_leftear.xml"));
            RightEarCascadeClassifier = new CascadeClassifier(Path.Combine(haarFolder, "haarcascade_mcs_rightear.xml"));
        }

        private void Draw(Image<Bgr, byte> faceImage, Bgr bgr, List<Rectangle> rects)
        {
            foreach (var rect in rects)
            {
                faceImage.Draw(rect, bgr, 2);
            }
        }

        private void AddNonIntersecting(List<Rectangle> add, List<Rectangle> master)
        {
            var cleaned = new List<Rectangle>();
            foreach (var r in add.OrderBy(a => a.Width * a.Height))
            {
                if (!cleaned.Any(c => c.IntersectsWith(r)))
                {
                    cleaned.Add(r);
                    master.Add(r);
                }
            }
            
        }
        public List<Face> Detect(List<Rectangle> knownRectangles, Bitmap bitmap, CascadeClassifier faceClassifier, string classifier, int width = 100, int height = 100)
        {
            var faces = new List<Face>();
            using (var image = new Image<Bgr, byte>(bitmap))
            {
                var detectedFaces = faceClassifier.DetectMultiScale(image)
                    .Where(f => !knownRectangles.Any(k => f.Equals(k) || k.Equals(f)))
                    .OrderBy(f=> f.Width * f.Height)
                    .ToList();
                foreach (var f in detectedFaces)
                {
                    var faceImage = image.Copy(f).Resize(width, height, Inter.Cubic);
                    var bytes = ImageToByteArray(faceImage.Bitmap);
                    var distinct = new List<Rectangle>();
                    int numSources = 0;
                    if (useAdditionalDetections)
                    {
                        var eyes = EyeCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var glasses = GlassesCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var mouths = MouthCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var smiles = SmileCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var ears = EarCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var rightEars = RightEarCascadeClassifier.DetectMultiScale(faceImage).ToList();
                        var noses = NoseCascadeClassifier.DetectMultiScale(faceImage).ToList();

                        numSources = (eyes.Any() ? 1 : 0) + (glasses.Any() ? 1 : 0) + (mouths.Any() || smiles.Any() ? 1 : 0) + (ears.Any() || rightEars.Any() ? 1 : 0) + (noses.Any() ? 1 : 0);
                        Draw(faceImage, new Bgr(Color.Yellow), eyes);
                        Draw(faceImage, new Bgr(Color.Black), glasses);
                        Draw(faceImage, new Bgr(Color.Magenta), mouths);
                        Draw(faceImage, new Bgr(Color.Sienna), smiles);
                        Draw(faceImage, new Bgr(Color.Green), ears);
                        Draw(faceImage, new Bgr(Color.Red), rightEars);
                        Draw(faceImage, new Bgr(Color.Navy), noses);

                        var all = new List<Rectangle>();
                        AddNonIntersecting(eyes, all);
                        AddNonIntersecting(glasses, all);
                        var mouthsAndSmiles = new List<Rectangle>();
                        AddNonIntersecting(mouths, mouthsAndSmiles);
                        AddNonIntersecting(smiles, mouthsAndSmiles);
                        AddNonIntersecting(mouthsAndSmiles, all);
                        AddNonIntersecting(ears, all);
                        AddNonIntersecting(rightEars, all);
                        AddNonIntersecting(noses, all);

                        
                        foreach (var rect in all.OrderBy(a => a.Width * a.Height))
                        {
                            if (!distinct.Any(d => d.Contains(rect) || rect.Contains(d)))
                            {
                                distinct.Add(rect);
                            }
                        }
                        Logger.Trace($"Found {all.Count} facets, {distinct.Count} distinct, {eyes.Count} eyes, {mouths.Count} mouths, {ears.Count} ears, {rightEars.Count} right ears, {noses.Count} noses");
                    }
                    if (!useAdditionalDetections || (distinct.Count > 1 && numSources > 1))
                    {
                        var dbFace = new PhotoBook.DataManager.Models.Face
                        {
                            Bytes = bytes,
                            Haar = classifier,
                            RectX = f.X,
                            RectY = f.Y,
                            RectHeight = f.Height,
                            RectWidth = f.Width,
                            NeedsValidation = true
                        };
#if DEBUG
                        dbFace.Bytes = ImageToByteArray(faceImage.Bitmap);
#endif
                        faces.Add(new Face
                        {

                            Image = faceImage.Convert<Gray, byte>(),
                            DbFace = dbFace
                        });
                        image.Draw(f, new Bgr(0, double.MaxValue, 0), 3);
                    }
                    else
                    {
                        if (writeImagesToLocal)
                        {
                            var failures = Path.Combine(imagesToLocalPath, "failures");
                            if (!Directory.Exists(failures))
                            {
                                Directory.CreateDirectory(failures);
                            }
                            
                            faceImage.Save(Path.Combine(failures, $"{distinct.Count}_{Guid.NewGuid():N}.jpg"));
                        }
                        faceImage.Dispose();
                    }
                }

                if (writeImagesToLocal)
                {
                    var facesDetected = Path.Combine(imagesToLocalPath, "FacesDetected");
                    if (!Directory.Exists(facesDetected))
                    {
                        Directory.CreateDirectory(facesDetected);
                    }
                    image.Save(Path.Combine(facesDetected, $"{detectedFaces.Count}_{Guid.NewGuid():N}.jpg"));
                }
            }

            return faces;
        }

        public byte[] ImageToByteArray(Image imageIn)
        {
            using (var ms = new MemoryStream())
            {
                imageIn.Save(ms, ImageFormat.Jpeg);
                return ms.ToArray();
            }
        }

        public void Dispose()
        {
            EyeCascadeClassifier?.Dispose();
            GlassesCascadeClassifier?.Dispose();
            NoseCascadeClassifier?.Dispose();
            MouthCascadeClassifier?.Dispose();
            SmileCascadeClassifier?.Dispose();
            EarCascadeClassifier?.Dispose();
            RightEarCascadeClassifier?.Dispose();
        }
    }
}
