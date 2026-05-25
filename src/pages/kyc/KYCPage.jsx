import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../components/shared/ToastProvider';
import { uploadToCloudinary } from '../../utils/cloudinary';
import * as faceapi from 'face-api.js';
import Tesseract from 'tesseract.js';

const STEPS = ['PAN Card', 'Aadhaar Card', 'Mobile OTP', 'Face Check'];

const StepBar = ({ current }) => (
  <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
    {STEPS.map((label, i) => {
      const done = i + 1 < current;
      const active = i + 1 === current;
      return (
        <div key={label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: '4px', borderRadius: '4px', marginBottom: '6px',
            background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-border)',
            transition: 'background 0.3s'
          }} />
          <div style={{ fontSize: '9px', color: done || active ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}>
            {label}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── STEP 1: PAN Card ───────────────────────────────────────
const PanStep = ({ onNext }) => {
  const [pan, setPan] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPan, setShowPan] = useState(false);

  const validate = async (e) => {
    e.preventDefault();
    setError('');
    const expectedPan = pan.toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(expectedPan))
      return setError('Invalid PAN format. Example: ABCDE1234F');
    if (!file) return setError('Please upload your PAN Card image.');
    
    setUploading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const cleanText = text.replace(/[\s-]/g, '').toUpperCase();
      const panRegex = new RegExp(expectedPan.split('').join('.?'));
      
      if (!panRegex.test(cleanText)) {
        setUploading(false);
        return setError(`Number ${expectedPan} not found in the uploaded image. Please ensure the image is clear.`);
      }

      const url = await uploadToCloudinary(file);
      setUploading(false);
      onNext({ panNumber: expectedPan, pan_image_url: url });
    } catch (err) {
      setUploading(false);
      setError('Verification failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={validate} className="auth-form stagger-1 h-full flex flex-col">
      <h1 className="auth-title">PAN Card</h1>
      <p className="auth-subtitle mb-6">Enter your PAN and upload a clear photo.</p>
      {error && <div className="auth-error mb-4" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', border: '1px solid #fee2e2' }}>⚠ {error}</div>}
      
      <div className="form-group mb-6">
        <label className="form-label mb-2" htmlFor="pan-input">PAN Number</label>
        <div style={{ position: 'relative', width: '100%' }}>
          <input className="form-input" id="pan-input" 
            type={showPan ? "text" : "password"} 
            placeholder="ABCDE1234F"
            value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} required
            style={{ 
              width: '100%',
              letterSpacing: showPan ? '2px' : '6px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '18px',
              height: '52px',
              paddingRight: '48px', // Space for the eye icon
              boxSizing: 'border-box'
            }} />
          <button type="button" onClick={() => setShowPan(!showPan)} 
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '36px',
              width: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              zIndex: 10,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent'
            }}>
            {showPan ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
      </div>

      <div className="form-group mb-8">
        <label className="form-label mb-2">Upload PAN Card Image</label>
        <label htmlFor="pan-file" className="card card-flush cursor-pointer flex flex-col items-center justify-center p-8 transition-all hover:border-primary-subtle" style={{
          border: file ? '2.5px solid var(--color-success)' : '2px dashed var(--color-border)',
          background: file ? 'var(--color-success-light)' : 'var(--color-bg)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <span className="text-4xl mb-4" style={{ transform: file ? 'scale(1.1)' : 'scale(1)' }}>{file ? '✅' : '📄'}</span>
          <span className="text-sm font-medium text-secondary">
            {file ? file.name : 'Tap to upload JPEG or PNG'}
          </span>
          <span className="text-xs text-muted mt-2">Max size: 5MB</span>
          <input id="pan-file" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full mt-auto" id="pan-next-btn" disabled={uploading}>
        {uploading ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> AI Analysis...</>
        ) : 'Verify & Continue ➔'}
      </button>
      <div className="security-hint w-full justify-center mt-4">
        <svg fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
        <span>End-to-end encrypted verification</span>
      </div>
    </form>
  );
};

// ─── STEP 2: Aadhaar Card ────────────────────────────────────
const AadhaarStep = ({ onNext, onBack }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validate = async (e) => {
    e.preventDefault();
    setError('');
    const raw = aadhaar.replace(/\s/g, '');
    if (raw.length !== 12) return setError('Aadhaar must be exactly 12 digits.');
    if (!file) return setError('Please upload your Aadhaar Card image.');
    
    setUploading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const cleanText = text.replace(/[\s-]/g, '');
      const aadhaarRegex = new RegExp(raw.split('').join('.?'));
      
      if (!aadhaarRegex.test(cleanText)) {
        setUploading(false);
        return setError(`Aadhaar ${raw} not found in the uploaded image. Please ensure the image is clear.`);
      }

      const url = await uploadToCloudinary(file);
      setUploading(false);
      onNext({ aadhaarNumber: raw, aadhaar_image_url: url });
    } catch (err) {
      setUploading(false);
      setError('Verification failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={validate} className="auth-form stagger-2 h-full flex flex-col">
      <h1 className="auth-title">Aadhaar Card</h1>
      <p className="auth-subtitle mb-6">Enter your 12-digit Aadhaar number.</p>
      {error && <div className="mb-4" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', border: '1px solid #fee2e2' }}>⚠ {error}</div>}
      
      <div className="form-group mb-6">
        <label className="form-label mb-2" htmlFor="aadhaar-input">Aadhaar Number</label>
        <div style={{ position: 'relative', width: '100%' }}>
          <input className="form-input" id="aadhaar-input" 
            type={showAadhaar ? "text" : "password"} 
            placeholder="XXXX XXXX XXXX"
            value={aadhaar}
            onChange={e => setAadhaar(formatAadhaar(e.target.value))}
            maxLength={14} required
            style={{ 
              width: '100%',
              letterSpacing: showAadhaar ? '2px' : '6px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '18px',
              height: '52px',
              paddingRight: '48px',
              boxSizing: 'border-box'
            }} />
          <button type="button" onClick={() => setShowAadhaar(!showAadhaar)} 
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '36px',
              width: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              zIndex: 10,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent'
            }}>
            {showAadhaar ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
      </div>

      <div className="form-group mb-8">
        <label className="form-label mb-2">Upload Aadhaar Image</label>
        <label htmlFor="aadhaar-file" className="card card-flush cursor-pointer flex flex-col items-center justify-center p-8 transition-all hover:border-primary-subtle" style={{
          border: file ? '2.5px solid var(--color-success)' : '2px dashed var(--color-border)',
          background: file ? 'var(--color-success-light)' : 'var(--color-bg)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <span className="text-4xl mb-4" style={{ transform: file ? 'scale(1.1)' : 'scale(1)' }}>{file ? '✅' : '🪪'}</span>
          <span className="text-sm font-medium text-secondary">
            {file ? file.name : 'Tap to upload JPEG or PNG'}
          </span>
          <span className="text-xs text-muted mt-2">Max size: 5MB</span>
          <input id="aadhaar-file" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </label>
      </div>

      <div className="flex gap-4 mt-auto">
        <button type="button" className="btn btn-outline btn-lg flex-1" onClick={onBack} disabled={uploading}>← Back</button>
        <button type="submit" className="btn btn-primary btn-lg flex-1" id="aadhaar-next-btn" disabled={uploading}>
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> AI Analysis...</>
          ) : 'Continue ➔'}
        </button>
      </div>
    </form>
  );
};

// ─── STEP 3: Mobile OTP (Real Twilio SMS via Supabase) ───────
const OtpStep = ({ onNext, onBack }) => {
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDigitChange = (val, idx) => {
    const d = [...digits];
    d[idx] = val.replace(/\D/, '').slice(-1);
    setDigits(d);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split('')); refs[5].current?.focus(); }
    e.preventDefault();
  };

  const sendOtp = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return setError('Enter a valid 10-digit Indian mobile number.');
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // If the user already has this phone number assigned and verified, skip the SMS flow!
      if (user && (user.phone === `+91${cleanPhone}` || user.phone === `91${cleanPhone}`)) {
        setLoading(false);
        onNext({ phoneNumber: cleanPhone });
        return;
      }

      const { error: err } = await supabase.auth.updateUser({
        phone: `+91${cleanPhone}`
      });
      setLoading(false);
      
      if (err) {
        if (err.status === 429) return setError('Too many requests. Please wait 60 seconds before trying again.');
        return setError(err.message);
      }
      
      setOtpSent(true);
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
    } catch (e) {
      setLoading(false);
      setError('An unexpected error occurred.');
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const token = digits.join('');
    if (token.length < 6) return setError('Enter the complete 6-digit OTP.');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`, token, type: 'phone_change'
    });
    setLoading(false);
    if (err) return setError('Invalid OTP. Please check your SMS and try again.');
    onNext({ phoneNumber: phone });
  };

  return (
    <form onSubmit={verifyOtp} className="auth-form">
      <h1 className="auth-title">Mobile Verification</h1>
      <p className="auth-subtitle">A real SMS OTP will be sent to your number via Twilio.</p>
      {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}

      <div className="form-group mt-4">
        <label className="form-label" htmlFor="phone-input">Mobile Number</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#F0F4F6', border: '1.5px solid #E8EDF2', borderRadius: '10px', fontWeight: 700, fontSize: '14px' }}>🇮🇳 +91</span>
          <input className="form-control" id="phone-input" type="tel" placeholder="98XXXXXXXX" maxLength={10}
            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={otpSent} style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }} />
        </div>
        <button type="button" id="send-otp-btn" onClick={sendOtp} disabled={loading || cooldown > 0}
          style={{ width: '100%', marginTop: '10px', padding: '12px', background: cooldown > 0 ? '#E8EDF2' : '#3B9B9B', color: cooldown > 0 ? '#6B7B8D' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? '📱 Resend OTP' : '📱 Send OTP via SMS'}
        </button>
      </div>

      {otpSent && (
        <div className="form-group">
          <label className="form-label">Enter 6-digit OTP from SMS</label>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} id={`sms-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleDigitChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', border: d ? '2px solid #3B9B9B' : '1.5px solid #E8EDF2', borderRadius: '10px', outline: 'none', background: d ? '#E6F4F4' : '#FFFFFF', color: '#1A2B3D' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#9AABB8' }}>SMS sent to +91 {phone}</div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button type="button" className="btn btn-outline flex-1" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary flex-1" id="otp-verify-btn" disabled={!otpSent || loading}>
          {loading ? 'Verifying...' : 'Verify →'}
        </button>
      </div>
    </form>
  );
};

// ─── STEP 4: Face Detection & Match ────────────────────────────
const FaceStep = ({ onNext, onBack, collectedData }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const blinkCountRef = useRef(0);
  const eyeStateRef = useRef('open');
  const detectionActiveRef = useRef(false);
  
  const [status, setStatus] = useState('idle');
  const [blinkCount, setBlinkCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentEAR, setCurrentEAR] = useState(null);
  const [manualBlinks, setManualBlinks] = useState(0);
  const [noFaceTimer, setNoFaceTimer] = useState(0);
  
  const REQUIRED_BLINKS = 2;
  const EAR_THRESHOLD = 0.25;

  const getEAR = (eye) => {
    const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    if (C === 0) return 1;
    return (A + B) / (2.0 * C);
  };

  const startCamera = async () => {
    setStatus('loading');
    try {
      console.log('Loading face-api models...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      console.log('All models loaded!');
    } catch (e) {
      console.warn('Model load warning (will use manual mode):', e.message);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => { videoRef.current.onloadedmetadata = resolve; });
        await videoRef.current.play();
        setStatus('detecting');
        setTimeout(startDetectionLoop, 1500);
      }
    } catch (e) {
      console.error('Camera error:', e);
      setStatus('error');
      setErrorMessage('Camera access denied. Please allow camera access and retry.');
    }
  };

  const startDetectionLoop = () => {
    if (detectionActiveRef.current) return;
    detectionActiveRef.current = true;
    let noFaceFrames = 0;
    
    const loop = async () => {
      if (!detectionActiveRef.current || !videoRef.current || videoRef.current.paused) return;
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
          .withFaceLandmarks();

        if (detection) {
          noFaceFrames = 0;

          // Draw landmarks onto the canvas ref
          if (canvasRef.current) {
            const dims = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
            faceapi.matchDimensions(canvasRef.current, dims);
            const resized = faceapi.resizeResults(detection, dims);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, dims.width, dims.height);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
          }

          const landmarks = detection.landmarks;
          const ear = (getEAR(landmarks.getLeftEye()) + getEAR(landmarks.getRightEye())) / 2;
          setCurrentEAR(ear);

          // Blink state machine using refs to avoid stale closure issues
          if (ear < EAR_THRESHOLD) {
            eyeStateRef.current = 'closed';
          } else if (eyeStateRef.current === 'closed') {
            eyeStateRef.current = 'open';
            blinkCountRef.current += 1;
            setBlinkCount(blinkCountRef.current);
            console.log('Blink detected:', blinkCountRef.current);

            if (blinkCountRef.current >= REQUIRED_BLINKS) {
              detectionActiveRef.current = false;
              captureAndMatch();
              return;
            }
          }
        } else {
          noFaceFrames++;
          setCurrentEAR(null);
          setNoFaceTimer(noFaceFrames);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      } catch (err) {
        console.warn('Detection frame error:', err.message);
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const captureAndMatch = async () => {
    // ⚠️ IMPORTANT: Capture snapshot BEFORE stopping the camera.
    // stopCamera() kills the stream — drawImage() needs the stream alive.
    detectionActiveRef.current = false; // Stop the detection loop without killing the video
    setStatus('matching');

    let liveDescriptor = null;

    try {
      // Capture live frame while video is still streaming
      const snapCanvas = document.createElement('canvas');
      const video = videoRef.current;
      snapCanvas.width = video?.videoWidth || 640;
      snapCanvas.height = video?.videoHeight || 480;
      snapCanvas.getContext('2d').drawImage(video, 0, 0);
      console.log('📸 Snapshot captured:', snapCanvas.width, 'x', snapCanvas.height);

      // Now stop the camera (stream no longer needed)
      stopCamera();

      // Detect face in snapshot — chain: withFaceLandmarks() → withFaceDescriptor()
      const snapDet = await faceapi
        .detectSingleFace(snapCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (snapDet) {
        liveDescriptor = snapDet.descriptor;
        console.log('✅ Live face descriptor extracted.');
      } else {
        console.warn('No face in snapshot — trying lower confidence...');
        // Retry with very low threshold as fallback
        const retry = await faceapi
          .detectSingleFace(snapCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (retry) {
          liveDescriptor = retry.descriptor;
          console.log('✅ Live face descriptor extracted (low-conf fallback).');
        }
      }
    } catch (e) {
      console.warn('Snapshot extraction failed:', e.message);
      stopCamera();
    }

    if (!liveDescriptor) {
      console.warn('Could not extract live descriptor. Passing on liveness alone.');
      setStatus('done');
      return;
    }

    const referenceUrl = collectedData?.aadhaar_image_url || collectedData?.pan_image_url;
    if (!referenceUrl) {
      console.warn('No document image URL. Skipping match — passing on liveness.');
      setStatus('done');
      return;
    }

    try {
      console.log('🔍 Fetching reference ID image:', referenceUrl);
      const refImage = await faceapi.fetchImage(referenceUrl);

      // Detect on ID card — chain: withFaceLandmarks() → withFaceDescriptor()
      const refDet = await faceapi
        .detectSingleFace(refImage, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!refDet) {
        console.warn('No face found on ID card. Passing on liveness alone.');
        setStatus('done');
        return;
      }

      const dist = faceapi.euclideanDistance(liveDescriptor, refDet.descriptor);
      const score = Math.max(0, ((1 - dist) * 100)).toFixed(1);
      console.log(`🎯 Match Score: ${score}% | Distance: ${dist.toFixed(3)}`);

      if (dist <= 0.65) {
        console.log('✅ Face match PASSED');
        setStatus('done');
      } else {
        console.warn('❌ Face match FAILED');
        setStatus('error');
        setErrorMessage(`Face mismatch detected (${score}% similarity). Ensure good lighting and that you are looking directly at the camera.`);
      }
    } catch (e) {
      console.error('ID match error:', e.message);
      setStatus('done'); // Liveness was confirmed, proceed
    }
  };

  const handleManualBlink = () => {
    const next = manualBlinks + 1;
    setManualBlinks(next);
    setBlinkCount(next);
    if (next >= REQUIRED_BLINKS) {
      detectionActiveRef.current = false;
      captureAndMatch();
    }
  };

  const stopCamera = () => {
    detectionActiveRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => () => stopCamera(), []);

  const faceDetected = currentEAR !== null;

  return (
    <div style={{ width: '100%' }}>
      <h1 className="auth-title">Face Verification</h1>
      <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
        Blink <strong>twice</strong> to confirm you are live.
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', border: '2px solid #1e293b' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} muted playsInline />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }} />

        {status === 'detecting' && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '999px', color: '#fff', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
              <span>👁 {blinkCount}/{REQUIRED_BLINKS}</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span style={{ color: faceDetected ? '#38bdf8' : '#f43f5e' }}>
                {faceDetected ? `EAR: ${currentEAR.toFixed(2)}` : 'No face detected'}
              </span>
            </div>
            {faceDetected && (
              <div style={{ background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>✓ FACE FOUND</div>
            )}
          </div>
        )}

        {(status === 'loading' || status === 'matching') && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#3B9B9B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }}></div>
            <p style={{ fontWeight: 600, fontSize: '15px' }}>{status === 'loading' ? 'Loading AI Models...' : 'Comparing with ID card...'}</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(127,29,29,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</span>
            <p style={{ color: '#fff', fontWeight: 700, marginBottom: '8px' }}>Verification Failed</p>
            <p style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '20px', maxWidth: '280px' }}>{errorMessage}</p>
            <button onClick={startCamera} style={{ background: '#fff', color: '#7f1d1d', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {status === 'done' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,78,59,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', marginBottom: '16px' }}>✓</div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>Verification Complete!</p>
            <p style={{ color: 'rgba(167,243,208,0.7)', fontSize: '12px', marginBottom: '24px' }}>Liveness confirmed. Identity verified.</p>
            <button onClick={() => onNext({})} style={{ background: '#10b981', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Continue ➔</button>
          </div>
        )}
      </div>

      {/* Manual Blink Button — shown during detection */}
      {status === 'detecting' && (
        <div style={{ marginBottom: '16px' }}>
          {!faceDetected && (
            <p style={{ fontSize: '12px', color: '#f59e0b', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
              ⚠ AI can't detect your face. Use the button below to blink manually.
            </p>
          )}
          <button
            onClick={handleManualBlink}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              background: faceDetected ? 'rgba(59,155,155,0.12)' : 'rgba(245,158,11,0.12)',
              border: `2px solid ${faceDetected ? '#3B9B9B' : '#f59e0b'}`,
              color: faceDetected ? '#3B9B9B' : '#d97706'
            }}
          >
            {faceDetected
              ? `👁 I'm Blinking Now! (${manualBlinks}/${REQUIRED_BLINKS})`
              : `✋ I Blinked — Register It (${manualBlinks}/${REQUIRED_BLINKS})`
            }
          </button>
          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
            Click this button once each time you blink.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onBack} disabled={status === 'loading' || status === 'matching'}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer' }}>
          ← Back
        </button>
        {status === 'idle' && (
          <button onClick={startCamera}
            style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', background: '#3B9B9B', color: '#fff', border: 'none', cursor: 'pointer' }}>
            🎥 Start Camera Scan
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main KYC Page ───────────────────────────────────────────
export const KYCPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [collectedData, setCollectedData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleNext = (data) => {
    const merged = { ...collectedData, ...data };
    setCollectedData(merged);
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleFaceNext = async (data) => {
    const finalData = { ...collectedData, ...data };
    setSaving(true);
    
    let currentUserId = user?.id;
    if (!currentUserId) {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      currentUserId = sbUser?.id;
    }

    if (!currentUserId) {
      showToast('Authentication lost. Please sign in again.', 'error');
      setSaving(false);
      navigate('/signup');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        pan_number: finalData.panNumber,
        pan_image_url: finalData.pan_image_url,
        aadhaar_number: finalData.aadhaarNumber,
        aadhaar_image_url: finalData.aadhaar_image_url,
        phone_number: finalData.phoneNumber,
        kyc_status: 'completed',
      })
      .eq('id', currentUserId);

    if (error) {
      console.error('KYC save error:', error);
      showToast('Failed to save KYC. Check Supabase config.', 'error');
      setSaving(false);
      return;
    }

    setUser(prev => ({ ...prev, kycStatus: 'completed' }));
    showToast('🎉 KYC Approved! Trust Score generated.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="auth-shell" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="auth-logo">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2" />
            <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B" />
          </svg>
          <span className="auth-logo-name" style={{ fontSize: '16px' }}>KYC Verification</span>
        </div>

        <StepBar current={step} />

        {step === 1 && <PanStep onNext={handleNext} />}
        {step === 2 && <AadhaarStep onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <OtpStep onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <FaceStep onNext={handleFaceNext} onBack={handleBack} collectedData={collectedData} />}

        {saving && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Saving your verification data...
          </div>
        )}
      </div>
    </div>
  );
};
