import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VideoCourses = ({ navigateTo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoCounts, setVideoCounts] = useState({
    generalVideos: 0,
    masterclassVideos: 0
  });

  // 🚨 ADDED: Function to trigger global updates for navigation
  const triggerGlobalVideoCountUpdate = () => {
    // Dispatch event to update App.jsx navigation counts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('videoCountsUpdated'));
      console.log('🔄 Triggered global video count update from VideoCourses');
    }
  };

  useEffect(() => {
    fetchVideoCounts();
    fetchVideos();
    
    // 🚨 ADDED: Listen for video count updates from admin
    const handleVideoCountsUpdate = () => {
      console.log('🔄 VideoCourses: Received video count update event');
      fetchVideoCounts();
    };

    window.addEventListener('videoCountsUpdated', handleVideoCountsUpdate);
    
    return () => {
      window.removeEventListener('videoCountsUpdated', handleVideoCountsUpdate);
    };
  }, [activeTab]);

  const fetchVideoCounts = async () => {
    try {
      console.log('📊 Fetching video counts for badges...');
      
      const response = await api.get('/videos/count');
      
      if (response.data.success) {
        setVideoCounts({
          generalVideos: response.data.generalVideos || 0,
          masterclassVideos: response.data.masterclassVideos || 0
        });
        console.log('✅ Video counts loaded:', response.data);
        
        // 🚨 ADDED: Trigger global update to ensure App.jsx has latest counts
        triggerGlobalVideoCountUpdate();
      } else {
        console.warn('⚠️ Failed to load video counts:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching video counts:', error);
      // Don't set error state here - we can still show the page
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching ${activeTab} videos...`);
      
      const response = await api.get('/videos', {
        params: { 
          type: activeTab,
          page: 1, 
          limit: 50 
        }
      });
      
      console.log('📹 Videos response:', response.data);
      
      if (response.data.success) {
        setVideos(response.data.videos || []);
        console.log(`✅ Loaded ${response.data.videos?.length || 0} ${activeTab} videos`);
      } else {
        setError('Failed to load videos: ' + (response.data.message || 'Unknown error'));
        setVideos([]);
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      setError('Failed to load videos. Please try again later.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const viewVideo = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const formatVideoDate = (video) => {
    if (video.uploadedAt) return new Date(video.uploadedAt).toLocaleDateString();
    if (video.createdAt) return new Date(video.createdAt).toLocaleDateString();
    if (video.date) return new Date(video.date).toLocaleDateString();
    return 'Date not available';
  };

  const handleMasterclassVideosTab = () => {
    console.log('🎯 Navigating to Masterclass Videos');
    if (navigateTo) {
      navigateTo('masterclass-videos');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-primary">Loading Videos...</h4>
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
              <button className="btn btn-primary" onClick={fetchVideos}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-courses" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card text-white bg-success shadow-lg">
              <div className="card-body py-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="display-5 fw-bold mb-2">
                      <i className="fas fa-video me-3"></i>
                      Video Courses
                    </h1>
                    <p className="lead mb-0 opacity-75">
                      Watch educational videos directly in the app. Stream seamlessly.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="bg-white rounded p-3 d-inline-block text-success">
                      <h4 className="mb-0 fw-bold">{videoCounts.generalVideos + videoCounts.masterclassVideos}</h4>
                      <small>Total Videos Available</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - UPDATED WITH UNIFORM BADGES */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <ul className="nav nav-tabs nav-justified">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                      onClick={() => setActiveTab('general')}
                    >
                      <i className="fas fa-video me-2"></i>General Videos
                      <span className="badge bg-success ms-2">{videoCounts.generalVideos}</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'masterclass' ? 'active' : ''}`}
                      onClick={handleMasterclassVideosTab}
                    >
                      <i className="fas fa-crown me-2"></i>Masterclass Videos
                      <span className="badge bg-warning ms-2">{videoCounts.masterclassVideos}</span>
                    </button>
                  </li>
                </ul>
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
                  <h3 className="text-muted">No Videos Available</h3>
                  <p className="text-muted">
                    There are no {activeTab} videos available at the moment. 
                    Check back later for new video additions.
                  </p>
                  <button className="btn btn-success" onClick={fetchVideos}>
                    Refresh Videos
                  </button>
                </div>
              </div>
            ) : (
              <div className="row">
                {videos.map((video) => (
                  <div key={video._id} className="col-lg-6 col-xl-4 mb-4">
                    <div className="card video-card h-100 shadow-sm border-0">
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
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className={`badge ${video.videoType === 'general' ? 'bg-success' : 'bg-warning'} fs-6`}>
                            <i className={`fas ${video.videoType === 'general' ? 'fa-video' : 'fa-crown'} me-1`}></i>
                            {video.videoType === 'general' ? 'General Video' : 'Masterclass Video'}
                          </span>
                          <small className="text-muted">
                            {formatVideoDate(video)}
                          </small>
                        </div>
                        
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
                            className="btn btn-success btn-sm"
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
                  <i className="fas fa-video me-2"></i>
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
                        <strong>Type:</strong> {selectedVideo.videoType === 'general' ? 'General Video' : 'Masterclass Video'}
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
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2) !important;
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

export default VideoCourses;