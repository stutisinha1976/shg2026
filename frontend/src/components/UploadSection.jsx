import { useState, useRef } from 'react'
import { Upload, AlertTriangle, Search, X, Image } from 'lucide-react'

import './UploadSection.css'

export default function UploadSection({ onUpload, error }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.')
      return
    }

    if (f.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.')
      return
    }

    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleSubmit = () => {
    if (file) onUpload(file)
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="upload-section" id="upload-section">
      <div className="upload-container">
        <h2 className="section-title">
          <span className="icon"><Upload size={18} className='inline-block mr-1' /></span>
          Upload Ledger Image
        </h2>

        <div
          className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${preview ? 'dropzone-has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !preview && inputRef.current?.click()}
        >
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Ledger preview" className="preview-image" />
              <div className="preview-overlay">
                <span className="preview-filename">{file.name}</span>
                <span className="preview-size">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button className="preview-remove" onClick={(e) => { e.stopPropagation(); handleRemove(); }}>
                <X size={18} className='inline-block mr-1' />
              </button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="dropzone-icon"><Image size={18} className='inline-block mr-1' /></div>
              <p className="dropzone-text">
                Drag & drop your ledger image here
              </p>
              <p className="dropzone-subtext">
                or click to browse • JPEG, PNG, WebP • Max 10MB
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files[0])}
            className="dropzone-input"
          />
        </div>

        {error && (
          <div className="upload-error">
            <span><AlertTriangle size={18} className='inline-block mr-1' /></span> {error}
          </div>
        )}

        <button
          className="btn-primary analyze-btn"
          onClick={handleSubmit}
          disabled={!file}
        >
          <span><Search size={18} className='inline-block mr-1' /> Analyze Ledger</span>
        </button>

        <div className="upload-samples">
          <p className="upload-samples-label">Supported formats: SHG meeting registers, passbooks, and handwritten ledgers</p>
        </div>
      </div>
    </section>
  )
}
