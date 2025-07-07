document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const transformedCanvas = document.getElementById('transformedCanvas');
    const ctx = transformedCanvas.getContext('2d', { willReadFrequently: true });
    const colorBitsSlider = document.getElementById('colorBits');
    const colorBitsValueSpan = document.getElementById('colorBitsValue');
    const resolutionSlider = document.getElementById('resolution');
    const resolutionValueSpan = document.getElementById('resolutionValue');
    const resetButton = document.getElementById('resetButton');

    let uploadedImage = new Image();
    let originalImageData = null; // To store the original pixel data
    const TARGET_WIDTH = 500; // Target width for displayed images

    // --- Drag and Drop Logic ---
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImage(files[0]);
        }
    });

    // --- File Input Change Logic ---
    imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleImage(files[0]);
        }
    });

    // --- Image Handling Function ---
    function handleImage(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImage.onload = () => {
                    // Display original image (scaled to TARGET_WIDTH)
                    const originalRatio = uploadedImage.width / uploadedImage.height;
                    originalImage.width = TARGET_WIDTH;
                    originalImage.height = TARGET_WIDTH / originalRatio;
                    originalImage.src = uploadedImage.src;

                    // Draw to a hidden canvas to get original pixel data
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = uploadedImage.width;
                    tempCanvas.height = uploadedImage.height;
                    tempCtx.drawImage(uploadedImage, 0, 0);
                    originalImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

                    // Apply initial transformations (will use default slider values)
                    applyTransformations();
                };
                uploadedImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('画像ファイルを選択してください。');
        }
    }

    // --- Apply Image Transformations ---
    function applyTransformations() {
        if (!originalImageData) return;

        // Reset canvas size to original image dimensions for processing
        // This ensures pixel manipulation is done on the full resolution
        const processingWidth = originalImageData.width;
        const processingHeight = originalImageData.height;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = processingWidth;
        tempCanvas.height = processingHeight;
        tempCtx.putImageData(originalImageData, 0, 0);

        let imageData = tempCtx.getImageData(0, 0, processingWidth, processingHeight);
        let data = imageData.data;

        const colorBits = parseInt(colorBitsSlider.value);
        const resolution = parseInt(resolutionSlider.value) / 100; // Convert to ratio

        // --- Apply Color Bit Reduction ---
        // This is a simplified reduction. For true bit depth, complex dithering or color palette reduction is needed.
        // Here, we quantize the color values.
        if (colorBits < 24) {
            const levels = Math.pow(2, colorBits / 3); // Simple distribution for RGB components
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.round(Math.round(data[i] / 255 * (levels - 1)) * (255 / (levels - 1)));     // Red
                data[i + 1] = Math.round(Math.round(data[i + 1] / 255 * (levels - 1)) * (255 / (levels - 1))); // Green
                data[i + 2] = Math.round(Math.round(data[i + 2] / 255 * (levels - 1)) * (255 / (levels - 1))); // Blue
            }
        }
        tempCtx.putImageData(imageData, 0, 0); // Put processed data back to temp canvas

        // --- Apply Resolution Change ---
        const newWidth = Math.max(1, Math.round(processingWidth * resolution));
        const newHeight = Math.max(1, Math.round(processingHeight * resolution));

        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');
        finalCanvas.width = newWidth;
        finalCanvas.height = newHeight;

        // Draw the potentially color-reduced image from tempCanvas to finalCanvas with new resolution
        // Using imageSmoothingEnabled = false for pixelated effect when reducing resolution
        finalCtx.imageSmoothingEnabled = resolution === 1 ? true : false;
        finalCtx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

        // Now, scale this finalCanvas down to TARGET_WIDTH for display
        const displayRatio = finalCanvas.width / finalCanvas.height;
        transformedCanvas.width = TARGET_WIDTH;
        transformedCanvas.height = TARGET_WIDTH / displayRatio;

        // Clear and draw the final scaled image to the displayed canvas
        ctx.clearRect(0, 0, transformedCanvas.width, transformedCanvas.height);
        ctx.imageSmoothingEnabled = true; // Use smoothing for display scaling
        ctx.drawImage(finalCanvas, 0, 0, transformedCanvas.width, transformedCanvas.height);
    }

    // --- Slider Event Listeners ---
    colorBitsSlider.addEventListener('input', () => {
        colorBitsValueSpan.textContent = colorBitsSlider.value;
        applyTransformations();
    });

    resolutionSlider.addEventListener('input', () => {
        resolutionValueSpan.textContent = resolutionSlider.value;
        applyTransformations();
    });

    // --- Reset Button ---
    resetButton.addEventListener('click', () => {
        colorBitsSlider.value = 24;
        colorBitsValueSpan.textContent = 24;
        resolutionSlider.value = 100;
        resolutionValueSpan.textContent = 100;
        applyTransformations(); // Reapply with default values
    });

    // Set initial placeholder image for transformed canvas
    const initialPlaceholder = new Image();
    initialPlaceholder.onload = () => {
        const ratio = initialPlaceholder.width / initialPlaceholder.height;
        transformedCanvas.width = TARGET_WIDTH;
        transformedCanvas.height = TARGET_WIDTH / ratio;
        ctx.drawImage(initialPlaceholder, 0, 0, transformedCanvas.width, transformedCanvas.height);
    };
    initialPlaceholder.src = 'https://via.placeholder.com/300x200?text=Transformed+Image';
});