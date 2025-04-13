"use client"; // This directive is necessary for using hooks

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'; // Using lucide-react icons

// Define face colors for display (Tailwind classes)
const FACE_COLORS: { [key: string]: string } = {
    U: 'bg-white border-gray-300', // White
    R: 'bg-red-600 border-red-800',   // Red
    F: 'bg-green-600 border-green-800', // Green
    D: 'bg-yellow-400 border-yellow-600',// Yellow
    L: 'bg-orange-500 border-orange-700',// Orange
    B: 'bg-blue-600 border-blue-800',  // Blue
};
const FACE_NAMES = ['U (White)', 'R (Red)', 'F (Green)', 'D (Yellow)', 'L (Orange)', 'B (Blue)'];


export default function SolvePage() {
    const [images, setImages] = useState<(File | null)[]>(Array(6).fill(null));
    const [previews, setPreviews] = useState<(string | null)[]>(Array(6).fill(null));
    const [isLoading, setIsLoading] = useState(false);
    const [solution, setSolution] = useState<string | null>(null);
    // Store error as an object for more details potentially
    const [error, setError] = useState<{ message: string; details?: any } | null>(null);

    // Refs for file inputs to allow triggering click from button
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleImageChange = useCallback((index: number, file: File | null) => {
        if (file) {
            // Basic validation (optional but good)
            if (!file.type.startsWith('image/')) {
                setError({ message: `File ${file.name} is not an image.` });
                return;
            }
            // Limit file size (e.g., 10MB)
            if (file.size > 10 * 1024 * 1024) {
                 setError({ message: `Image ${file.name} is too large (max 10MB).` });
                 return;
            }

            const newImages = [...images];
            newImages[index] = file;
            setImages(newImages);

            // Generate preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const newPreviews = [...previews];
                newPreviews[index] = reader.result as string;
                setPreviews(newPreviews);
            };
            reader.readAsDataURL(file);
             setError(null); // Clear previous file errors if successful
        } else {
             // Handle case where selection is cancelled or file removed
             const newImages = [...images];
             newImages[index] = null;
             setImages(newImages);
             const newPreviews = [...previews];
             newPreviews[index] = null;
             setPreviews(newPreviews);
        }
    }, [images, previews]); // Dependencies needed for useCallback

    const triggerFileSelect = (index: number) => {
        fileInputRefs.current[index]?.click();
    };

     const removeImage = (index: number) => {
          handleImageChange(index, null);
          // Also clear the file input value if possible
          if (fileInputRefs.current[index]) {
               fileInputRefs.current[index]!.value = '';
          }
     };

    const canSolve = images.every(img => img !== null);

    const handleSolve = async () => {
        if (!canSolve) return;

        setIsLoading(true);
        setSolution(null);
        setError(null);

        const formData = new FormData();
        images.forEach((file, index) => {
            if (file) {
                // Use a consistent key pattern the backend expects
                formData.append(`face_${index}`, file, file.name);
            }
        });

        try {
            // IMPORTANT: Replace with your actual backend URL
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api/solve_from_images';
            console.log(`Sending request to: ${backendUrl}`);

            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed for FormData; browser sets it
            });

            const result = await response.json();

            if (response.ok) {
                setSolution(result.solution);
                console.log("Solution received:", result.solution);
            } else {
                console.error("API Error Response:", result);
                // Handle complex error object from backend
                if (typeof result.error === 'object' && result.error !== null) {
                     setError({ message: result.error.message || 'An unknown error occurred.', details: result.error });
                } else {
                     setError({ message: result.error || `Request failed with status ${response.status}` });
                }
                 setSolution(null);
            }
        } catch (err) {
            console.error("Network or fetch error:", err);
            let message = "An unknown network error occurred.";
            if (err instanceof Error) {
                message = `Network Error: ${err.message}. Could not connect to the backend. Is it running?`;
            }
            setError({ message });
            setSolution(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-700">
                Rubik's Cube Solver
            </h1>
            <p className="text-center text-gray-600 mb-8">
                Upload or capture an image for each of the 6 cube faces (White=Up, Red=Right, Green=Front...).
            </p>

            {/* Image Upload Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {FACE_NAMES.map((name, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-4 flex flex-col items-center border border-gray-200">
                        <h2 className={`font-semibold mb-3 text-center ${index === 0 ? 'text-gray-700' : index === 1 ? 'text-red-600' : index === 2 ? 'text-green-600' : index === 3 ? 'text-yellow-500' : index === 4 ? 'text-orange-500' : 'text-blue-600'}`}>
                            {name}
                        </h2>
                        <div className="w-32 h-32 md:w-40 md:h-40 mb-3 bg-gray-200 rounded flex items-center justify-center overflow-hidden relative border">
                            {previews[index] ? (
                                <>
                                    <img src={previews[index]!} alt={`Preview ${index + 1}`} className="object-cover w-full h-full" />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                                        aria-label="Remove image"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </>
                            ) : (
                                <Camera size={40} className="text-gray-400" />
                            )}
                        </div>
                        {/* Hidden file input */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Prioritize rear camera on mobile
                            ref={(el) => (fileInputRefs.current[index] = el)}
                            onChange={(e) => handleImageChange(index, e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                            id={`file-upload-${index}`}
                        />
                         {/* Visible button to trigger file input */}
                         <button
                              onClick={() => triggerFileSelect(index)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                              disabled={isLoading}
                         >
                              <Upload size={16} />
                              {previews[index] ? 'Change' : 'Upload'}
                         </button>
                    </div>
                ))}
            </div>

             {/* Solve Button */}
            <div className="text-center mb-8">
                <button
                    onClick={handleSolve}
                    disabled={!canSolve || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto w-full max-w-xs"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" /> Processing...
                        </>
                    ) : (
                        'Solve Cube'
                    )}
                </button>
            </div>

             {/* Result/Error Display */}
            <div className="results-area mt-6">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow" role="alert">
                        <strong className="font-bold block mb-1"><AlertTriangle className="inline mr-2" size={20}/>Error:</strong>
                        <span className="block sm:inline text-sm">{error.message}</span>
                        {/* Optionally display more details */}
                        {error.details && typeof error.details === 'object' && (
                             <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                                  {JSON.stringify(error.details, null, 2)}
                             </pre>
                        )}
                    </div>
                )}
                {solution && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative shadow" role="alert">
                         <strong className="font-bold block mb-2"><CheckCircle className="inline mr-2" size={20}/>Solution Found:</strong>
                         <p className="text-sm md:text-base font-mono bg-green-50 p-3 rounded break-words">
                              {solution}
                         </p>
                    </div>
                )}
            </div>

             {/* Footer/Info */}
             <footer className="text-center mt-12 text-xs text-gray-500">
                 <p>Tip: Ensure good lighting and capture each face clearly for best results.</p>
                 <p>Color detection depends heavily on image quality and lighting conditions.</p>
             </footer>

        </main>
    );
}