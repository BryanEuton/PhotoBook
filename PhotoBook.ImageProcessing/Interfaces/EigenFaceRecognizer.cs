using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Emgu.CV;
using Emgu.CV.Face;
using Emgu.CV.Util;

namespace PhotoBook.ImageProcessing.Interfaces
{
    /// <summary>
    /// Eigen face recognizer
    /// </summary>
    public class EigenFaceRecognizer : BasicFaceRecognizer
    {
        /// <summary>
        /// Create an EigenFaceRecognizer
        /// </summary>
        /// <param name="numComponents">The number of components</param>
        /// <param name="threshold">The distance threshold</param>
        public EigenFaceRecognizer(int numComponents = 0, double threshold = double.MaxValue)
        {
            _ptr = FaceInvoke.cveEigenFaceRecognizerCreate(numComponents, threshold, ref _faceRecognizerPtr, ref _basicFaceRecognizerPtr, ref _sharedPtr);
        }

        /// <summary>
        /// Train the face recognizer with the specific images and labels
        /// </summary>
        /// <param name="images">The images used in the training.</param>
        /// <param name="labels">The labels of the images.</param>
        public void Train<TColor, TDepth>(Image<TColor, TDepth>[] images, int[] labels)
            where TColor : struct, IColor
            where TDepth : new()
        {
            using (VectorOfMat imgVec = new VectorOfMat())
            using (VectorOfInt labelVec = new VectorOfInt(labels))
            {
                imgVec.Push<TDepth>(images);
                Train(imgVec, labelVec);
            }
        }

        /// <summary>
        /// Release the unmanaged memory associated with this EigenFaceRecognizer
        /// </summary>
        protected override void DisposeObject()
        {
            if (_sharedPtr == IntPtr.Zero)
                FaceInvoke.cveEigenFaceRecognizerRelease(ref _sharedPtr);
            base.DisposeObject();
        }

    }


    /// <summary>
    /// Class that contains entry points for the Face module.
    /// </summary>
    public static partial class FaceInvoke
    {

        [DllImport(CvInvoke.ExternLibrary, CallingConvention = CvInvoke.CvCallingConvention)]
        internal extern static IntPtr cveEigenFaceRecognizerCreate(
            int numComponents,
            double threshold,
            ref IntPtr faceRecognizerPtr,
            ref IntPtr basicFaceRecognizerPtr,
            ref IntPtr sharedPtr);
        [DllImport(CvInvoke.ExternLibrary, CallingConvention = CvInvoke.CvCallingConvention)]
        internal extern static void cveEigenFaceRecognizerRelease(ref IntPtr sharedPtr);

    }


}
