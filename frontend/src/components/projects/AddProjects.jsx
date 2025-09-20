import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    liveUrl: '',
    isPublic: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert comma-separated techStack to array
    const projectData = {
      ...formData,
      techStack: formData.techStack.split(',').map(tech => tech.trim()).filter(tech => tech)
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Project created successfully!');
        navigate('/'); // Go back to home for now
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Add New Project</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="E-Commerce Platform"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="A full-stack e-commerce application with user authentication, product catalog, shopping cart, and payment integration..."
          />
        </div>

        {/* Tech Stack */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologies Used *
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.techStack}
            onChange={(e) => setFormData({...formData, techStack: e.target.value})}
            placeholder="React, Node.js, Express, MongoDB, Tailwind CSS"
          />
          <p className="text-sm text-gray-500 mt-1">Separate technologies with commas</p>
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.githubUrl}
            onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
            placeholder="https://github.com/username/project"
          />
        </div>

        {/* Live URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Live Demo URL
          </label>
          <input
            type="url"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.liveUrl}
            onChange={(e) => setFormData({...formData, liveUrl: e.target.value})}
            placeholder="https://myproject.vercel.app"
          />
        </div>

        {/* Public/Private */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
            Make this project public (visible to recruiters and other users)
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;