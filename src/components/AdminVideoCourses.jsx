import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminVideoCourses = () => {
  // State declarations
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload-general');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videoTypeFilter, setVideoTypeFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    videoType: 'general',
    category: '',
    accessCode: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    isActive: true
  });
  
  // Custom alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  // Effects
  useEffect(() => {
    if (activeTab === 'view-videos') {
      fetchVideos();
    }
  }, [currentPage, itemsPerPage, activeTab]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, videoTypeFilter]);

  // Helper functions
  const showCustomAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const filterVideos = () => {
    let filtered = videos;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(video =>
        video.title?.toLowerCase().includes(term) ||
        video.description?.toLowerCase().includes(term) ||
        video.category?.toLowerCase().includes(term)
      );
    }
    
    if (videoTypeFilter) {
      filtered = filtered.filter(video => video.videoType === videoTypeFilter);
    }
    
    setFilteredVideos(filtered);
  };

  // API functions - FIXED ENDPOINTS
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the correct endpoint - /api/videos for admin access
      const response = await api.get('/videos', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          type: videoTypeFilter || '',
          search: searchTerm,
          admin: true // Add admin flag to indicate admin access
        }
      });
      
      if (response.data.success) {
        setVideos(response.data.videos || []);
        setTotalItems(response.data.totalCount || 0);
      } else {
        setError('Failed to load videos data');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
      
      if (!allowedTypes.includes(file.type)) {
        showCustomAlert('Please select a video file (MP4, MOV, AVI, MKV, WEBM)', 'error');
        e.target.value = '';
        return;
      }
      
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        showCustomAlert('File size must be less than 500MB', 'error');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.description.trim() || !selectedFile) {
      showCustomAlert('Please fill all fields and select a video file', 'error');
      return;
    }

    if (uploadForm.videoType === 'masterclass' && !uploadForm.accessCode.trim()) {
      showCustomAlert('Please provide an access code for masterclass videos', 'error');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('videoType', uploadForm.videoType);
      formData.append('category', uploadForm.category);
      formData.append('accessCode', uploadForm.accessCode);
      formData.append('videoFile', selectedFile);

      // Use the correct endpoint for video upload
      const response = await api.post('/admin/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showCustomAlert(`Video uploaded successfully!`, 'success');
        setShowUploadModal(false);
        resetUploadForm();
        // Refresh videos if on view tab
        if (activeTab === 'view-videos') {
          fetchVideos();
        }
      } else {
        showCustomAlert('Failed to upload video. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      showCustomAlert('Failed to upload video. Please try again.', 'error');
    }
    
    setUploading(false);
  };

  const handleEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) {
      showCustomAlert('Please fill all required fields', 'error');
      return;
    }

    try {
      // Use the correct endpoint for updating videos
      const response = await api.put(`/admin/videos/${selectedVideo._id}`, editForm);
      
      if (response.data.success) {
        showCustomAlert('Video updated successfully!', 'success');
        setShowEditModal(false);
        fetchVideos();
      } else {
        showCustomAlert('Failed to update video. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      showCustomAlert('Failed to update video. Please try again.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      // Use the correct endpoint for deleting videos
      const response = await api.delete(`/admin/videos/${selectedVideo._id}`);
      
      if (response.data.success) {
        showCustomAlert('Video deleted successfully!', 'success');
        setShowDeleteModal(false);
        fetchVideos();
      } else {
        showCustomAlert('Failed to delete video. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showCustomAlert('Failed to delete video. Please try again.', 'error');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      videoType: 'general',
      category: '',
      accessCode: ''
    });
    setSelectedFile(null);
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setEditForm({
      title: video.title,
      description: video.description,
      category: video.category || '',
      isActive: video.isActive !== false // Default to true if undefined
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  // Pagination functions
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Videos pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
              </li>
              {startPage > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
              </li>
            </>
          )}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // Loading state
  if (loading && activeTab === 'view-videos') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-success mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-success">Loading Videos Data...</h4>
                <p className="text-muted">Fetching videos information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && activeTab === 'view-videos') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
              <div>
                <h4 className="alert-heading">Oops! Something went wrong</h4>
                <p className="mb-0">{error}</p>
                <button className="btn btn-outline-danger mt-2" onClick={fetchVideos}>
                  <i className="fas fa-redo me-2"></i>Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-video-courses" style={{ background: '#f9fafb', minHeight: '100vh' }}>
      {/* Custom Alert Component */}
      {showAlert && (
        <div className={`custom-alert custom-alert-${alertType}`}>
          <div className="alert-content">
            <i className={`fas ${
              alertType === 'success' ? 'fa-check-circle' :
              alertType === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            } me-2`}></i>
            {alertMessage}
            <button
              className="alert-close"
              onClick={() => setShowAlert(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card text-white shadow-lg" style={{backgroundColor: '#28a745'}}>
              <div className="card-body py-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="display-5 fw-bold mb-2">
                      <i className="fas fa-video me-3"></i>
                      Manage Videos - Admin Dashboard
                    </h1>
                    <p className="lead mb-0 opacity-75">Upload and manage general and masterclass videos</p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="bg-white rounded p-3 d-inline-block" style={{color: '#28a745'}}>
                      <h4 className="mb-0 fw-bold">{totalItems}</h4>
                      <small>Total Videos</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <ul className="nav nav-tabs nav-justified" id="videosTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'upload-general' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upload-general')}
                    >
                      <i className="fas fa-upload me-2"></i>Upload General Videos
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'upload-masterclass' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upload-masterclass')}
                    >
                      <i className="fas fa-crown me-2"></i>Upload Masterclass Videos
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'view-videos' ? 'active' : ''}`}
                      onClick={() => setActiveTab('view-videos')}
                    >
                      <i className="fas fa-list me-2"></i>View/Edit/Delete Videos
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg border-0">
              <div className="card-body">
                {/* Upload General Videos Tab */}
                {activeTab === 'upload-general' && (
                  <div className="upload-section">
                    <h4 className="mb-4" style={{color: '#155724'}}>
                      <i className="fas fa-video me-2"></i>
                      Upload General Video
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Video Title</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter video title..."
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Enter video description..."
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Category</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., Travel, Tourism, Hotels..."
                            value={uploadForm.category}
                            onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Video File</label>
                          <input
                            type="file"
                            className="form-control"
                            accept="video/*"
                            onChange={handleFileSelect}
                          />
                          <small className="text-muted">Supported formats: MP4, MOV, AVI, MKV, WEBM (Max 500MB)</small>
                        </div>
                        <button
                          className="btn btn-success btn-lg"
                          onClick={() => {
                            setUploadForm({...uploadForm, videoType: 'general'});
                            setShowUploadModal(true);
                          }}
                          disabled={!uploadForm.title || !uploadForm.description || !selectedFile}
                        >
                          <i className="fas fa-upload me-2"></i>Upload General Video
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="alert alert-success">
                          <h6><i className="fas fa-info-circle me-2"></i>General Videos Information</h6>
                          <ul className="mb-0">
                            <li>General videos are accessible to all users</li>
                            <li>No access codes required</li>
                            <li>Users will see notification badges</li>
                            <li>Upload MP4, MOV, AVI, MKV, or WEBM files</li>
                            <li>Maximum file size: 500MB</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Masterclass Videos Tab */}
                {activeTab === 'upload-masterclass' && (
                  <div className="upload-section">
                    <h4 className="mb-4" style={{color: '#155724'}}>
                      <i className="fas fa-crown me-2"></i>
                      Upload Masterclass Video
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Video Title</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter video title..."
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Enter video description..."
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Category</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., Premium Travel, Exclusive Tours..."
                            value={uploadForm.category}
                            onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Access Code</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter access code (will be provided to specific users)..."
                            value={uploadForm.accessCode}
                            onChange={(e) => setUploadForm({...uploadForm, accessCode: e.target.value})}
                          />
                          <small className="text-muted">This code will be required for users to access the video</small>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Video File</label>
                          <input
                            type="file"
                            className="form-control"
                            accept="video/*"
                            onChange={handleFileSelect}
                          />
                          <small className="text-muted">Supported formats: MP4, MOV, AVI, MKV, WEBM (Max 500MB)</small>
                        </div>
                        <button
                          className="btn btn-warning btn-lg"
                          onClick={() => {
                            setUploadForm({...uploadForm, videoType: 'masterclass'});
                            setShowUploadModal(true);
                          }}
                          disabled={!uploadForm.title || !uploadForm.description || !uploadForm.accessCode || !selectedFile}
                        >
                          <i className="fas fa-crown me-2"></i>Upload Masterclass Video
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="alert alert-warning">
                          <h6><i className="fas fa-exclamation-triangle me-2"></i>Masterclass Videos Information</h6>
                          <ul className="mb-0">
                            <li>Require access codes for user access</li>
                            <li>Each code can be used by one user only</li>
                            <li>Generate additional codes as needed</li>
                            <li>Premium content for authorized users</li>
                            <li>Same access codes as masterclass courses</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View/Edit/Delete Videos Tab */}
                {activeTab === 'view-videos' && (
                  <div className="view-videos-section">
                    {/* Search and Filter Controls */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search videos by title, description, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={videoTypeFilter}
                          onChange={(e) => setVideoTypeFilter(e.target.value)}
                        >
                          <option value="">All Video Types</option>
                          <option value="general">General Videos</option>
                          <option value="masterclass">Masterclass Videos</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                    </div>

                    {/* Videos Table */}
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Duration</th>
                            <th>Uploaded</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVideos.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4">
                                <i className="fas fa-video-slash fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No videos found</h5>
                                <p className="text-muted">Try adjusting your search or filters</p>
                              </td>
                            </tr>
                          ) : (
                            filteredVideos.map((video) => (
                              <tr key={video._id}>
                                <td>
                                  <strong>{video.title}</strong>
                                  <br />
                                  <small className="text-muted">{video.description?.substring(0, 50)}...</small>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    video.videoType === 'general' ? 'bg-success' : 'bg-warning'
                                  }`}>
                                    {video.videoType}
                                  </span>
                                </td>
                                <td>
                                  <small>
                                    <i className="fas fa-tag me-1"></i>
                                    {video.category || 'Uncategorized'}
                                  </small>
                                </td>
                                <td>
                                  <small>
                                    <i className="fas fa-clock me-1"></i>
                                    {video.duration || 'N/A'}
                                  </small>
                                </td>
                                <td>
                                  <small>
                                    {video.uploadedAt 
                                      ? new Date(video.uploadedAt).toLocaleDateString()
                                      : video.createdAt 
                                        ? new Date(video.createdAt).toLocaleDateString()
                                        : 'Date not available'
                                    }
                                  </small>
                                </td>
                                <td>
                                  <span className={`badge ${video.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                    {video.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => openEditModal(video)}
                                      title="Edit Video"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() => openDeleteModal(video)}
                                      title="Delete Video"
                                      >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="row mt-4">
                        <div className="col-12">
                          {renderPagination()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{backgroundColor: uploadForm.videoType === 'general' ? '#28a745' : '#ffc107', color: 'white'}}>
                <h5 className="modal-title">
                  <i className={`fas ${uploadForm.videoType === 'general' ? 'fa-video' : 'fa-crown'} me-2`}></i>
                  Confirm {uploadForm.videoType === 'general' ? 'General' : 'Masterclass'} Video Upload
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <h6>Video Details:</h6>
                  <p><strong>Title:</strong> {uploadForm.title}</p>
                  <p><strong>Type:</strong> {uploadForm.videoType}</p>
                  <p><strong>Category:</strong> {uploadForm.category}</p>
                  <p><strong>File:</strong> {selectedFile?.name}</p>
                  {uploadForm.videoType === 'masterclass' && (
                    <p><strong>Access Code:</strong> {uploadForm.accessCode}</p>
                  )}
                </div>
                <p className="text-muted">
                  This video will be immediately available to users. 
                  {uploadForm.videoType === 'masterclass' && ' Users will need the access code to view the content.'}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${uploadForm.videoType === 'general' ? 'btn-success' : 'btn-warning'}`}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-edit me-2"></i>
                  Edit Video
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Video Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    />
                    <label className="form-check-label fw-bold">Active Video</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEdit}
                >
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVideo && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <h6>Warning: This action cannot be undone!</h6>
                  <p className="mb-0">
                    You are about to delete the video: <strong>"{selectedVideo.title}"</strong>
                  </p>
                </div>
                <p className="text-muted">
                  This will remove the video from the system and users will no longer have access to it.
                  The notification count for users will be updated accordingly.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  <i className="fas fa-trash me-2"></i>
                  Delete Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .custom-alert {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 9999;
          min-width: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideInRight 0.3s ease-out;
        }
        
        .custom-alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .custom-alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .alert-content {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .alert-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          margin-left: 12px;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .nav-tabs .nav-link {
          color: #6c757d;
          font-weight: 500;
          border: none;
          padding: 1rem 1.5rem;
        }
        
        .nav-tabs .nav-link.active {
          color: #28a745;
          border-bottom: 3px solid #28a745;
          background: transparent;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(40, 167, 69, 0.05);
        }
        
        .btn-group-sm > .btn {
          padding: 0.25rem 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default AdminVideoCourses;