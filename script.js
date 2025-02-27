// document.addEventListener('DOMContentLoaded', function () {
//   const userDataForm = document.getElementById('userDataForm');
//   const imageUploadSection = document.getElementById('imageUploadSection');
//   const imageUpload = document.getElementById('imageUpload');
//   const verifyButton = document.getElementById('verifyButton');
//   const uploadButton = document.getElementById('uploadButton');
//   const numberInput = document.getElementById('number');
//   const expireDateInput = document.getElementById('expireDate');
//   const cvvInput = document.getElementById('cvv');
//   const amountToPayElement = document.getElementById('amountToPay');

//   let userLocation = 'unknown';

//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
//       userLocation = `${position.coords.latitude},${position.coords.longitude}`;
//     }, function(error) {
//       console.error('Error getting location:', error);
//       userLocation = 'location_error';
//     });
//   } else {
//     console.error('Geolocation is not supported by this browser.');
//     userLocation = 'not_supported';
//   }

//   console.log("amountToPayElement", amountToPayElement);

//   // Extract the amount parameter from the URL and display it
//   const urlParams = new URLSearchParams(window.location.search);
//   const amount = urlParams.get('amount') || 0; // Default to 0 if not provided
//   amountToPayElement.textContent = `Amount to Pay: $${amount}`;

//   // Format number input
//   numberInput.addEventListener('input', (e) => {
//     e.target.value = e.target.value
//         .replace(/\D/g, '')
//         .replace(/(.{4})/g, '$1 ')
//         .trim();
//   });

//   // Format expire date input
//   expireDateInput.addEventListener('input', (e) => {
//     e.target.value = e.target.value
//         .replace(/\D/g, '')
//         .replace(/^(\d{2})(\d{1,2})?$/, (match, p1, p2) => (p2 ? `${p1}/${p2}` : p1));
//   });

//   // Format CVV input
//   cvvInput.addEventListener('input', (e) => {
//     e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
//   });

//   document.getElementById('imageUpload').addEventListener('change', function(event) {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = function(e) {
//         const previewImage = document.getElementById('previewImage');
//         previewImage.src = e.target.result;
//         previewImage.style.display = 'block'; // Make the preview image visible
//       };
//       reader.readAsDataURL(file);
//     }
//   });

//   // Handle form submission
//   userDataForm.addEventListener('submit', async function (event) {
//     event.preventDefault();
//     const number = numberInput.value.replace(/\s+/g, '');
//     const expireDate = expireDateInput.value;
//     const cvv = cvvInput.value;

//     const response = await fetch('http://localhost:5000/verifyUser', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ number, expireDate, cvv }),
//     });

//     const result = await response.json();
    
//     if (response.ok && result.userId && result.image) {
//       alert('User verified. Please upload a photo for face verification.');
//       sessionStorage.setItem('faceDescriptorPath', result.image);
//       sessionStorage.setItem('userId', result.userId);

//       // Disable form inputs and button
//       numberInput.disabled = true;
//       expireDateInput.disabled = true;
//       cvvInput.disabled = true;
//       verifyButton.style.display = 'none';

//       // Show image upload section
//       imageUploadSection.style.display = 'block';
//     } else {
//       alert('No matching user found. Please check the details and try again.');
//     }
//   });

//   // Handle image upload
//   uploadButton.addEventListener('click', async function () {
//     const file = imageUpload.files[0];
//     if (!file) {
//       alert('Please select a file before uploading.');
//       return;
//     }

//     // Disable upload button and change text to "Checking..."
//     uploadButton.disabled = true;
//     uploadButton.innerText = 'Checking...';

//     try {
//       const userImage = await faceapi.bufferToImage(file);

//       // Load models from the server
//       await Promise.all([
//         faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost:8080/models'),
//         faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost:8080/models'),
//         faceapi.nets.ssdMobilenetv1.loadFromUri('http://localhost:8080/models'),
        
//       ]);

//       const imageToComparePath = sessionStorage.getItem('faceDescriptorPath');
//       const imgToCompare = await loadImageFromServer(imageToComparePath);
//       const faceMatcher = await createFaceMatcher(imgToCompare);

//       const match = await compareFaces(userImage, faceMatcher);

//       const userId = sessionStorage.getItem('userId');
//       const transactionStatus = match ? 1 : 0; // 1 for success, 0 for failure

//       // Post transaction to backend
//       await fetch('http://localhost:5000/addTransaction', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           userId,
//           amount,
//           status: transactionStatus,
//           location: userLocation,
//         }),
//       }).then(async (response) => {
//         if (response.ok) {
//           if (match) {
//             alert('Face matched successfully !\nTransaction added successfully !\nRedirecting ...');
//           } else {
//             alert('Face did not match. Redirecting...');
//           }
//         } else {
//           const errorMessage = await response.text(); 
//           console.error('Failed to add transaction:', errorMessage);
//           alert(errorMessage)
//         }
//       })

//       // Redirect to another page
//       window.location.href = 'http://localhost:3000/';
//       console.log('Error ........!!!');
//     } catch (error) {
//       console.error('Error processing image:', error);
//       alert('An error occurred while processing the image.');
//     } finally {
//       // Enable upload button and reset text
//       uploadButton.disabled = false;
//       uploadButton.innerText = 'Upload';
//     }
//   });

//   async function loadImageFromServer(imagePath) {
//     const response = await fetch(`http://localhost:8080/uploads/${imagePath}`);
//     const blob = await response.blob();
//     return await faceapi.bufferToImage(blob);
//   }

//   async function createFaceMatcher(image) {
//     const detection = await faceapi
//         .detectSingleFace(image)
//         .withFaceLandmarks()
//         .withFaceDescriptor();
//     return new faceapi.FaceMatcher([
//       new faceapi.LabeledFaceDescriptors('user', [detection.descriptor]),
//     ]);
//   }

//   async function compareFaces(image, faceMatcher) {
//     const detection = await faceapi
//         .detectSingleFace(image)
//         .withFaceLandmarks()
//         .withFaceDescriptor();
//     const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
//     return bestMatch.distance < 0.6;
//   }
// });


document.addEventListener('DOMContentLoaded', async function () {
  const userDataForm = document.getElementById('userDataForm');
  const verifyButton = document.getElementById('verifyButton');
  const numberInput = document.getElementById('number');
  const expireDateInput = document.getElementById('expireDate');
  const cvvInput = document.getElementById('cvv');
  const amountToPayElement = document.getElementById('amountToPay');
  let userLocation = 'unknown';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = `${position.coords.latitude},${position.coords.longitude}`;
    }, () => {
      userLocation = 'location_error';
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const amount = urlParams.get('amount') || 0;
  amountToPayElement.textContent = `Amount to Pay: $${amount}`;

  numberInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  });

  expireDateInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d{1,2})?$/, (match, p1, p2) => (p2 ? `${p1}/${p2}` : p1));
  });

  cvvInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
  });

  userDataForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const number = numberInput.value.replace(/\s+/g, '');
    const expireDate = expireDateInput.value;
    const cvv = cvvInput.value;

    const response = await fetch('http://localhost:5000/verifyUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, expireDate, cvv }),
    });

    const result = await response.json();
    if (response.ok && result.userId && result.image) {
      alert('User verified. Starting face verification.');
      sessionStorage.setItem('faceDescriptorPath', result.image);
      sessionStorage.setItem('userId', result.userId);
      startCamera();
    } else {
      alert('No matching user found. Please check the details and try again.');
    }
  });

  // async function startCamera() {
  //   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  //   const video = document.createElement('video');
  //   video.style.position = 'absolute';
  //   video.style.width = '15px';
  //   video.style.height = '15px';
  //   video.style.opacity = '0';
  //   video.srcObject = stream;
  //   document.body.appendChild(video);
  //   video.play();

  //   setTimeout(async () => {
  //     const canvas = document.createElement('canvas');
  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     const ctx = canvas.getContext('2d');
  //     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  //     const imageData = canvas.toDataURL('image/png');
  //     video.srcObject.getTracks().forEach(track => track.stop());
  //     document.body.removeChild(video);
  //     verifyFace(imageData);
  //   }, 10000);
  // }
  async function startCamera() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('http://localhost:8080/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost:8080/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost:8080/models')
    ]);

    const stream = await navigator.mediaDevices.getUserMedia({ video:  { width: 1280, height: 720 } });

    // Create a video element to display the camera feed
    const video = document.createElement('video');
    video.id = "liveCameraFeed"; 
    video.style.position = 'relative';
    video.style.width = '400px';
    video.style.height = '300px';
    video.autoplay = true;
    video.srcObject = stream;
    document.body.appendChild(video);

    // Create a canvas to draw the face bounding box
    const canvas = document.createElement('canvas');
    canvas.id = "faceCanvas";
    canvas.style.position = 'absolute';
    canvas.style.top = video.offsetTop + 'px';
    canvas.style.left = video.offsetLeft + 'px';
    document.body.appendChild(canvas);

    video.addEventListener('play', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }, 100);
    });

    setTimeout(async () => {
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageData = captureCanvas.toDataURL('image/png');

        // Stop the video stream and remove elements from UI
        video.srcObject.getTracks().forEach(track => track.stop());
        document.body.removeChild(video);
        document.body.removeChild(canvas);

        // Call face verification
        verifyFace(imageData);
    }, 3000);
}




  async function verifyFace(imageData) {
    try {
      await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost:8080/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost:8080/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('http://localhost:8080/models'),
      ]);

      const imageToComparePath = sessionStorage.getItem('faceDescriptorPath');
      const imgToCompare = await loadImageFromServer(imageToComparePath);
      const faceMatcher = await createFaceMatcher(imgToCompare);

      const capturedImage = await faceapi.bufferToImage(await fetchImage(imageData));
      const match = await compareFaces(capturedImage, faceMatcher);

      const userId = sessionStorage.getItem('userId');
      const transactionStatus = match ? 1 : 0;

      await fetch('http://localhost:5000/addTransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, status: transactionStatus, location: userLocation }),
      });
      
      alert(match ? 'Face matched successfully! Transaction successful!' : 'Face did not match. Transaction failed.');
      window.location.href = 'http://localhost:3000/customer';

    } catch (error) {
      console.error('Error processing face verification:', error);
      alert('An error occurred while processing the face verification.');
    }
  }

  async function loadImageFromServer(imagePath) {
    const response = await fetch(`http://localhost:8080/uploads/${imagePath}`);
    const blob = await response.blob();
    return await faceapi.bufferToImage(blob);
  }

  async function fetchImage(dataUrl) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  }

  async function createFaceMatcher(image) {
    const detection = await faceapi.detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      throw new Error("No face detected in the reference image.");
    }
  
    return new faceapi.FaceMatcher([new faceapi.LabeledFaceDescriptors('user', [detection.descriptor])]);
  }
  

  async function compareFaces(image, faceMatcher) {
    const detection = await faceapi.detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();
  
    if (!detection) {
      console.error("No face detected in the captured image.");
      return false;
    }
  
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
    return bestMatch.distance < 0.6;
  }
  
});
