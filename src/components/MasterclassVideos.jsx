import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MasterclassVideos = ({ navigateTo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    checkAccessAndFetchVideos();
  }, []);

  const checkAccessAndFetchVideos = async () => {
    try {
      setLoading(true);
      
      // First, try to fetch masterclass videos to see if user has access
      const response = await api.get('/videos', {
        params: {
          type: 'masterclass',
          page: 1,
          limit: 50
        }
      });
      
      if (response.data.success) {
        // Check if user actually has access by looking at the videos array
        if (response.data.videos.length === 0 && 
            response.data.message && 
            response.data.message.includes('No access to masterclass videos')) {
          setHasAccess(false);
          setVideos([]);
        } else {
          // User has access and there are videos (or no videos but user has access)
          setVideos(response.data.videos);
          setHasAccess(true);
          
          // Check localStorage for persistent access
          const storedAccess = localStorage.getItem('masterclassVideoAccess');
          if (!storedAccess) {
            localStorage.setItem('masterclassVideoAccess', 'granted');
          }
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      // More specific error handling
      if (error.response?.status === 403 || 
          error.response?.data?.message?.includes('No access') ||
          (error.response?.data?.videos && error.response.data.videos.length === 0)) {
        setHasAccess(false);
        setVideos([]);
      } else {
        setError('Failed to load videos. Please try again later.');
        // On general errors, still check localStorage for previous access
        const storedAccess = localStorage.getItem('masterclassVideoAccess');
        if (storedAccess === 'granted') {
          setHasAccess(true);
        }
      }
    } finally {
      setLoading(false);
      setAccessChecked(true);
    }
  };

  const requestAccess = () => {
    setAccessCode('');
    setValidationError('');
    setShowAccessModal(true);
  };

  const contactAdmin = () => {
    if (navigateTo) {
      navigateTo('contact-us');
    } else {
      console.error('Navigate function not available');
      // Fallback: try to use window location
      window.location.href = `${window.location.origin}/#/contact-us`;
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim()) {
      setValidationError('Please enter an access code');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      const response = await api.post('/videos/validate-masterclass-access', {
        accessCode: accessCode.trim()
      });

      if (response.data.success) {
        // Grant access
        setHasAccess(true);
        localStorage.setItem('masterclassVideoAccess', 'granted');
        setShowAccessModal(false);
        setAccessCode('');
        showCustomAlert('Access granted! Welcome to Masterclass Videos.', 'success');
        
        // Refresh videos now that access is granted
        await checkAccessAndFetchVideos();
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      setValidationError(
        error.response?.data?.message || 
        'Invalid access code. Please contact the administrator for a valid code.'
      );
    } finally {
      setValidating(false);
    }
  };

  const viewVideo = (video) => {
    if (!hasAccess) {
      requestAccess();
      return;
    }

    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const closeAccessModal = () => {
    setShowAccessModal(false);
    setAccessCode('');
    setValidationError('');
  };

  // Logout function that properly revokes access
  const handleLogout = () => {
    setHasAccess(false);
    localStorage.removeItem('masterclassVideoAccess');
    setVideos([]);
    showCustomAlert('Access revoked. You can enter a new access code anytime.', 'info');
  };

  const formatVideoDate = (video) => {
    if (video.uploadedAt) return new Date(video.uploadedAt).toLocaleDateString();
    if (video.createdAt) return new Date(video.createdAt).toLocaleDateString();
    if (video.date) return new Date(video.date).toLocaleDateString();
    return 'Date not available';
  };

  // Custom alert function
  const showCustomAlert = (message, type = 'success') => {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
      top: 100px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  };

  // If access not checked yet, show loading
  if (!accessChecked) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-warning mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-warning">Checking Access...</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access request page when user doesn't have access
  if (!hasAccess) {
    return (
      <div className="masterclass-videos" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <div className="container-fluid py-4">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="card shadow-lg border-warning">
                <div className="card-header bg-warning text-dark text-center py-4">
                  <i className="fas fa-crown fa-3x mb-3"></i>
                  <h1 className="display-5 fw-bold">Masterclass Videos</h1>
                  <p className="lead mb-0">Premium video content requiring special access</p>
                </div>
                <div className="card-body text-center py-5">
                  <div className="mb-4">
                    <i className="fas fa-lock fa-4x text-warning mb-3"></i>
                    <h3 className="text-dark">Access Required</h3>
                    <p className="text-muted">
                      Masterclass videos contain premium content that requires a special access code.
                      Please contact the administrator to obtain an access code.
                    </p>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <div className="card h-100 border-0 bg-light">
                        <div className="card-body">
                          <i className="fas fa-key fa-2x text-warning mb-3"></i>
                          <h5>Get Access Code</h5>
                          <p className="text-muted small">
                            Contact the administrator to receive your unique access code
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="card h-100 border-0 bg-light">
                        <div className="card-body">
                          <i className="fas fa-shield-alt fa-2x text-warning mb-3"></i>
                          <h5>Secure Access</h5>
                          <p className="text-muted small">
                            Each code is unique and can only be used by one user
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-warning btn-lg"
                    onClick={requestAccess}
                  >
                    <i className="fas fa-key me-2"></i>Enter Access Code
                  </button>
                  
                  <div className="mt-3">
                    <button 
                      className="btn btn-outline-dark btn-sm"
                      onClick={contactAdmin}
                    >
                      <i className="fas fa-envelope me-2"></i>Contact Administrator
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Code Modal */}
        {showAccessModal && (
          <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title">
                    <i className="fas fa-key me-2"></i>
                    Enter Access Code
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeAccessModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <h6>Masterclass Access Required</h6>
                    <p className="mb-0">Enter the access code provided by the administrator.</p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Access Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your access code..."
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      disabled={validating}
                    />
                    {validationError && (
                      <div className="text-danger small mt-2">{validationError}</div>
                    )}
                  </div>
                  
                  <div className="alert alert-warning">
                    <small>
                      <i className="fas fa-info-circle me-2"></i>
                      Don't have an access code? Contact the administrator to request one.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeAccessModal}
                    disabled={validating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={validateAccessCode}
                    disabled={validating || !accessCode.trim()}
                  >
                    {validating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Validating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        Validate Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading state (when user has access but data is loading)
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-warning mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-warning">Loading Masterclass Videos...</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="alert alert-danger text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h4>Error Loading Videos</h4>
              <p>{error}</p>
              <button className="btn btn-warning" onClick={checkAccessAndFetchVideos}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This is the "Access Granted" view that should only show when user has access
  return (
    <div className="masterclass-videos" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card text-white bg-warning shadow-lg">
              <div className="card-body py-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="display-5 fw-bold mb-2 text-dark">
                      <i className="fas fa-crown me-3"></i>
                      Masterclass Videos
                    </h1>
                    <p className="lead mb-0 opacity-75 text-dark">
                      Premium video content with exclusive access. Watch directly in the app.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="bg-dark rounded p-3 d-inline-block text-warning">
                      <h4 className="mb-0 fw-bold">{videos.length}</h4>
                      <small>Masterclass Videos</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Granted Banner */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-success border-0 shadow-sm">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 className="mb-1">
                    <i className="fas fa-check-circle me-2"></i>
                    Access Granted
                  </h5>
                  <p className="mb-0">
                    You have access to premium masterclass videos. All videos can be viewed directly in the app.
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <button 
                    className="btn btn-outline-success"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="row">
          <div className="col-12">
            {videos.length === 0 ? (
              <div className="card shadow-lg border-0">
                <div className="card-body text-center py-5">
                  <i className="fas fa-video-slash fa-4x text-muted mb-3"></i>
                  <h3 className="text-muted">No Masterclass Videos Available</h3>
                  <p className="text-muted">
                    There are no masterclass videos available at the moment. 
                    Check back later for new video additions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {videos.map((video) => (
                  <div key={video._id} className="col-lg-6 col-xl-4 mb-4">
                    <div className="card video-card h-100 shadow-sm border-warning">
                      <div className="card-header bg-warning text-dark border-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-dark fs-6">
                            <i className="fas fa-crown me-1"></i>
                            Masterclass
                          </span>
                          <i className="fas fa-unlock text-success"></i>
                        </div>
                      </div>
                      <div className="card-img-top position-relative">
                        <div 
                          className="video-thumbnail bg-dark d-flex align-items-center justify-content-center"
                          style={{ height: '200px', cursor: 'pointer' }}
                          onClick={() => viewVideo(video)}
                        >
                          <i className="fas fa-play-circle text-white fa-3x opacity-75"></i>
                          <div className="position-absolute bottom-0 start-0 m-2">
                            <span className="badge bg-dark bg-opacity-75">
                              <i className="fas fa-clock me-1"></i>
                              {video.duration || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title text-dark mb-3">{video.title}</h5>
                        <p className="card-text text-muted mb-3">
                          {video.description ? (video.description.length > 120 
                            ? `${video.description.substring(0, 120)}...` 
                            : video.description) : 'No description available'
                          }
                        </p>
                        
                        <div className="video-meta">
                          {video.category && (
                            <small className="text-muted d-block">
                              <i className="fas fa-tag me-1"></i>
                              {video.category}
                            </small>
                          )}
                          {video.fileSize && (
                            <small className="text-muted d-block">
                              <i className="fas fa-hdd me-1"></i>
                              {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-0 pt-0">
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => viewVideo(video)}
                          >
                            <i className="fas fa-play me-2"></i>Watch Video
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-dark">
              <div className="modal-header bg-dark text-white border-secondary">
                <h5 className="modal-title">
                  <i className="fas fa-crown me-2"></i>
                  {selectedVideo.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              
              <div className="modal-body p-0">
                <div className="video-container position-relative">
                  {selectedVideo.videoUrl ? (
                    <video
                      key={selectedVideo.videoUrl}
                      controls
                      controlsList="nodownload"
                      style={{ width: '100%', height: '60vh', backgroundColor: '#000' }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <source src={selectedVideo.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center text-white py-5" style={{ height: '60vh' }}>
                      <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                      <h4>Video Not Available</h4>
                      <p>The video content is currently unavailable.</p>
                    </div>
                  )}
                </div>
                
                {/* Video Info */}
                <div className="p-4 text-white">
                  <h6>Video Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Type:</strong> Masterclass Video
                      </p>
                      <p className="mb-2">
                        <strong>Uploaded:</strong> {formatVideoDate(selectedVideo)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Category:</strong> {selectedVideo.category || 'Not specified'}
                      </p>
                      {selectedVideo.duration && (
                        <p className="mb-2">
                          <strong>Duration:</strong> {selectedVideo.duration}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedVideo.description && (
                    <div className="mt-3">
                      <h6>Description</h6>
                      <p className="text-light">{selectedVideo.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer bg-dark border-secondary">
                <button
                  className="btn btn-outline-light"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .video-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2) !important;
        }

        .video-thumbnail:hover {
          opacity: 0.8;
        }

        video::-webkit-media-controls-fullscreen-button {
          display: none;
        }
        
        video {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default MasterclassVideos;