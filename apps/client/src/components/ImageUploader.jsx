// apps/client/src/components/ImageUploader.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

const ImageUploader = ({ onUpload, initialImage = null }) => {
  const [preview, setPreview] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('jan_token');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      return setError('Only JPG, PNG and WebP are allowed');
    }
    if (file.size > 2 * 1024 * 1024) {
      return setError('File too large (Max 2MB)');
    }

    setError(null);
    setUploading(true);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/images/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      onUpload(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setPreview(initialImage);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative h-48 rounded-[30px] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer ${
          preview ? 'border-transparent' : 'border-black/5 hover:border-[#D49E4A] bg-black/5'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</p>
            </div>
          </>
        ) : (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Upload size={20} className="text-black/20" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Drop image or click to upload</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-[#D49E4A]" />
            <p className="text-[9px] font-black uppercase tracking-widest">Uploading...</p>
          </div>
        )}
      </div>

      {error && <p className="text-[9px] text-red-500 font-bold px-2">{error}</p>}
      
      {preview && !uploading && (
        <button 
          onClick={(e) => { e.stopPropagation(); clearImage(); }}
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors px-2"
        >
          <X size={12} /> Remove Image
        </button>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/jpeg,image/png,image/webp"
      />
    </div>
  );
};

export default ImageUploader;
