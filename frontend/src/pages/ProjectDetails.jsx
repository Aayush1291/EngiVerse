import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';
import Modal from '../components/Modal.jsx';

const ProjectDetails = ({ showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthAnalysis, setHealthAnalysis] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pitchDeck, setPitchDeck] = useState(null);
  const [showPitchDeckModal, setShowPitchDeckModal] = useState(false);
  const [generatingPitchDeck, setGeneratingPitchDeck] = useState(false);
  const [plagiarismCheck, setPlagiarismCheck] = useState(null);

  useEffect(() => {
    loadProject();
    if (isOwner) {
      loadCollaborationRequests();
      loadPlagiarismCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwner]);

  useEffect(() => {
    if (project && user) {
      const userId = user.id || user._id;
      setIsOwner(project.owner._id === userId || project.owner._id?.toString() === userId?.toString());
      setIsCollaborator(project.collaborators?.some(c => {
        const collaboratorId = c.user._id || c.user.id;
        return collaboratorId === userId || collaboratorId?.toString() === userId?.toString();
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, user]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.project);
    } catch (error) {
      showToast('Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborationRequests = async () => {
    try {
      const response = await api.get(`/collaborations/project/${id}`);
      setCollaborationRequests(response.data.requests);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const loadPlagiarismCheck = async () => {
    try {
      const response = await api.get(`/plagiarism/project/${id}`);
      setPlagiarismCheck(response.data);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const handleGeneratePitchDeck = async () => {
    setGeneratingPitchDeck(true);
    try {
      const response = await api.get(`/pitchdeck/project/${id}`);
      setPitchDeck(response.data);
      setShowPitchDeckModal(true);
      showToast('Pitch deck generated successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to generate pitch deck', 'error');
    } finally {
      setGeneratingPitchDeck(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/collaborations/${requestId}/accept`);
      showToast('Collaboration request accepted!', 'success');
      loadProject();
      loadCollaborationRequests();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/collaborations/${requestId}/reject`);
      showToast('Collaboration request rejected', 'success');
      loadCollaborationRequests();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  const handleRequestCollaboration = async () => {
    if (!isAuthenticated) {
      showToast('Please login to request collaboration', 'error');
      navigate('/login');
      return;
    }

    try {
      await api.post('/collaborations/request', {
        projectId: id,
        message: requestMessage
      });
      showToast('Collaboration request sent!', 'success');
      setShowRequestModal(false);
      setRequestMessage('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  const handleAnalyzeHealth = async () => {
    try {
      const response = await api.get(`/health/project/${id}`);
      setHealthAnalysis(response.data);
      setShowHealthModal(true);
    } catch (error) {
      showToast('Failed to analyze project health', 'error');
    }
  };

  const handleLeaveProject = async () => {
    if (!window.confirm('Are you sure you want to leave this project?')) return;

    try {
      await api.post(`/projects/${id}/leave`);
      showToast('Left project successfully', 'success');
      loadProject();
    } catch (error) {
      showToast('Failed to leave project', 'error');
    }
  };

  const handleAddProgress = async () => {
    if (!progressUpdate.trim()) {
      showToast('Please enter a progress update', 'error');
      return;
    }

    try {
      await api.post(`/projects/${id}/progress`, { update: progressUpdate });
      showToast('Progress update added successfully!', 'success');
      setProgressUpdate('');
      setShowProgressModal(false);
      loadProject();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add progress update', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      await api.delete(`/projects/${id}`);
      showToast('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  if (loading) return <Loading />;
  if (!project) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 mb-6 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {project.domain}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {project.difficulty}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  project.status === 'Open' ? 'bg-green-100 text-green-800' :
                  project.status === 'Adopted' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to={`/projects/${id}/edit`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-700 mb-6">{project.description}</p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack?.map((tech, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Project Links */}
          {(project.liveUrl || project.githubRepo || project.documentationUrl || project.demoVideoUrl) && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Project Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <span>🌐</span>
                    <span className="font-medium">Live Demo</span>
                  </a>
                )}
                {project.githubRepo && (
                  <a
                    href={project.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>💻</span>
                    <span className="font-medium">GitHub Repository</span>
                  </a>
                )}
                {project.documentationUrl && (
                  <a
                    href={project.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <span>📚</span>
                    <span className="font-medium">Documentation</span>
                  </a>
                )}
                {project.demoVideoUrl && (
                  <a
                    href={project.demoVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <span>🎥</span>
                    <span className="font-medium">Demo Video</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Plagiarism Check Status (Owner Only) */}
          {isOwner && plagiarismCheck && plagiarismCheck.checked && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg ${plagiarismCheck.isPlagiarized ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      Plagiarism Check: {plagiarismCheck.isPlagiarized ? '⚠️ Similarity Detected' : '✅ Original'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Similarity Score: {plagiarismCheck.similarityScore}%
                    </p>
                    {plagiarismCheck.flags && plagiarismCheck.flags.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">Issues Detected:</p>
                        <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                          {plagiarismCheck.flags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plagiarismCheck.similarProjects && plagiarismCheck.similarProjects.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Similar Projects:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {plagiarismCheck.similarProjects.slice(0, 3).map((sp, idx) => (
                            <li key={idx}>
                              {sp.projectId?.title || 'Unknown'} ({sp.similarity}% similar)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Owner</h3>
            <p className="text-gray-700">{project.owner?.profile?.name || project.owner?.email}</p>
          </div>

          {project.mentor && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Mentor</h3>
              <p className="text-gray-700">{project.mentor?.profile?.name || project.mentor?.email}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Collaborators ({project.collaborators?.length || 0})</h3>
            {project.collaborators?.length > 0 ? (
              <div className="space-y-2">
                {project.collaborators.map((collab, index) => (
                  <p key={index} className="text-gray-700">
                    {collab.user?.profile?.name || collab.user?.email} - {collab.role}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No collaborators yet</p>
            )}
          </div>

          {/* Collaboration Requests (Owner Only) */}
          {isOwner && collaborationRequests.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Collaboration Requests ({collaborationRequests.filter(r => r.status === 'Pending').length})</h3>
                <button
                  onClick={() => setShowRequestsModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View All Requests
                </button>
              </div>
              <div className="space-y-2">
                {collaborationRequests.filter(r => r.status === 'Pending').slice(0, 3).map((request) => (
                  <div key={request._id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{request.requester?.profile?.name || request.requester?.email}</p>
                      <p className="text-sm text-gray-600">{request.message || 'No message'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mt-6">
            {isAuthenticated && !isOwner && !isCollaborator && project.status === 'Open' && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
              >
                Request Collaboration
              </button>
            )}
            {isCollaborator && (
              <button
                onClick={handleLeaveProject}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
              >
                Leave Project
              </button>
            )}
            {(isOwner || isCollaborator) && (
              <>
                <button
                  onClick={handleAnalyzeHealth}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
                >
                  Analyze Health
                </button>
                <button
                  onClick={handleGeneratePitchDeck}
                  disabled={generatingPitchDeck}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-lg transform hover:scale-105 disabled:opacity-50"
                >
                  {generatingPitchDeck ? 'Generating...' : 'Generate Pitch Deck'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Progress Timeline</h2>
            {(isOwner || isCollaborator) && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
              >
                + Add Update
              </button>
            )}
          </div>
          {project.progressTimeline?.length > 0 ? (
            <div className="space-y-4">
              {project.progressTimeline.map((update, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-6 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-gray-700 leading-relaxed">{update.update}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(update.date).toLocaleDateString()} by {update.addedBy?.profile?.name || update.addedBy?.email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No progress updates yet</p>
          )}
        </div>

        {/* Health Score */}
        {project.healthScore > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Project Health Score</h2>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary-600">{project.healthScore}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-primary-600 h-4 rounded-full"
                    style={{ width: `${project.healthScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="Request Collaboration"
        >
          <div className="space-y-4">
            <textarea
              placeholder="Why do you want to collaborate on this project?"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="4"
            />
            <button
              onClick={handleRequestCollaboration}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
            >
              Send Request
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          title="Project Health Analysis"
        >
          {healthAnalysis && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Health Score: {healthAnalysis.healthScore}/100</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-primary-600 h-4 rounded-full"
                    style={{ width: `${healthAnalysis.healthScore}%` }}
                  ></div>
                </div>
              </div>
              {healthAnalysis.missingModules?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Missing Modules</h3>
                  <ul className="list-disc list-inside">
                    {healthAnalysis.missingModules.map((module, index) => (
                      <li key={index} className="text-gray-700">{module}</li>
                    ))}
                  </ul>
                </div>
              )}
              {healthAnalysis.suggestedSteps?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Suggested Next Steps</h3>
                  <ul className="list-disc list-inside">
                    {healthAnalysis.suggestedSteps.map((step, index) => (
                      <li key={index} className="text-gray-700">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          isOpen={showProgressModal}
          onClose={() => {
            setShowProgressModal(false);
            setProgressUpdate('');
          }}
          title="Add Progress Update"
        >
          <div className="space-y-4">
            <textarea
              placeholder="Describe the progress made..."
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows="4"
            />
            <button
              onClick={handleAddProgress}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
            >
              Add Update
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
          title="Collaboration Requests"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {collaborationRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No collaboration requests</p>
            ) : (
              collaborationRequests.map((request) => (
                <div key={request._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{request.requester?.profile?.name || request.requester?.email}</p>
                      <p className="text-sm text-gray-600 mt-1">{request.message || 'No message provided'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.status === 'Pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          handleAcceptRequest(request._id);
                          setShowRequestsModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>

        <Modal
          isOpen={showPitchDeckModal}
          onClose={() => setShowPitchDeckModal(false)}
          title="Pitch Deck Presentation"
          size="large"
        >
          {pitchDeck && (
            <div className="space-y-6 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white p-6 rounded-lg shadow-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{pitchDeck.projectTitle}</h3>
                    <p className="text-sm opacity-90">Professional Pitch Deck • {pitchDeck.slides?.length || 10} Slides</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">Generated</p>
                    <p className="text-sm font-semibold">{new Date(pitchDeck.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Slides */}
              <div className="space-y-6">
                {pitchDeck.slides && Array.isArray(pitchDeck.slides) && pitchDeck.slides.map((slide, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                      minHeight: '300px',
                      background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
                    }}
                  >
                    {/* Slide Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                          {slide.slideNumber || index + 1}
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900">{slide.title}</h4>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Slide {slide.slideNumber || index + 1} of {pitchDeck.slides.length}
                      </span>
                    </div>

                    {/* Slide Content */}
                    <div className="text-gray-800 leading-relaxed">
                      {(() => {
                        // Handle different content types - ensure we always have a string
                        let contentText = '';
                        if (typeof slide.content === 'string') {
                          contentText = slide.content;
                        } else if (Array.isArray(slide.content)) {
                          contentText = slide.content.join('\n');
                        } else if (slide.content && typeof slide.content === 'object') {
                          // If content is an object, try to extract text
                          contentText = slide.content.text || slide.content.description || JSON.stringify(slide.content, null, 2);
                        } else if (slide.content != null) {
                          contentText = String(slide.content);
                        } else {
                          contentText = 'No content available for this slide.';
                        }
                        
                        // Ensure contentText is a string before splitting
                        if (typeof contentText !== 'string') {
                          contentText = String(contentText || '');
                        }
                        
return contentText.split('\n').map((line, lineIndex) => {
                          // Format bullet points
                          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                            return (
                              <div key={lineIndex} className="flex items-start mb-3 ml-4">
                                <span className="text-purple-600 mr-3 mt-1">•</span>
                                <span className="flex-1">{line.replace(/^[•-]\s*/, '')}</span>
                              </div>
                            );
                          }
                          // Format sub-bullets
                          if (line.trim().startsWith('-') && line.trim().length > 1) {
                            return (
                              <div key={lineIndex} className="flex items-start mb-2 ml-8">
                                <span className="text-gray-400 mr-2 mt-1">-</span>
                                <span className="flex-1 text-gray-700 text-sm">{line.replace(/^-\s*/, '')}</span>
                              </div>
                            );
                          }
                          // Format regular paragraphs
                          if (line.trim()) {
                            return (
                              <p key={lineIndex} className="mb-4 text-lg">
                                {line.trim()}
                              </p>
                            );
                          }
                          return <br key={lineIndex} />;
                        });
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              {pitchDeck.summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📋</span>
                    <h4 className="text-xl font-bold text-blue-900">Executive Summary</h4>
                  </div>
                  <p className="text-blue-800 leading-relaxed text-base">{pitchDeck.summary}</p>
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center text-sm text-gray-500 mt-6 pb-4">
                <p>This pitch deck follows the standard 10-slide startup/hackathon format</p>
                <p className="mt-1">Format: {pitchDeck.format || 'Professional'}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProjectDetails;

