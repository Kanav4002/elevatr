import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './(Auth)/register/RegisterPage';
import LoginPage from './(Auth)/login/LoginPage';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './components/projects/AddProjects';
import MyProjects from './components/projects/MyProjects';
import EditProject from './components/projects/EditProject';
import ProjectsBrowse from './components/projects/ProjectsBrowse';
import ProjectDetail from './components/projects/ProjectDetail';
import Layout from './components/Layout';
import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Layout (Navbar + Footer) */}
        <Route path="/" element={<Layout />}>
          {/* 🔧 MAKE HOME PAGE PUBLIC - Remove ProtectedRoute for landing page */}
          <Route index element={<HomePage />} />
          
          {/* 🔧 AUTH ROUTES - PUBLIC */}
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />

          {/* 🔧 ADD ABOUT ROUTE - PUBLIC */}
          <Route path="about" element={<AboutPage />} />

          {/* 🔧 PROTECTED ROUTES - REQUIRE AUTHENTICATION */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />

          <Route path="projects/new" element={
            <ProtectedRoute>
              <AddProject/>
            </ProtectedRoute>
          }/>

          <Route path="projects/my" element={
            <ProtectedRoute>
              <MyProjects/>
            </ProtectedRoute>
          }/>

          <Route path="projects/:id/edit" element={
            <ProtectedRoute>
              <EditProject/>
            </ProtectedRoute>
          }/>

          {/* 🔧 BROWSE PROJECTS - PROTECTED (Only for authenticated users) */}
          <Route path="projects/browse" element={
            <ProtectedRoute>
              <ProjectsBrowse/>
            </ProtectedRoute>
          }/>

          {/* 🔧 PROJECT DETAILS - PROTECTED */}
          <Route path="projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail/>
            </ProtectedRoute>
          }/>

          {/* 🔧 ADD OTHER NAVBAR ROUTES - PROTECTED */}
          <Route path="jobs" element={
            <ProtectedRoute>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Find Jobs - Coming Soon!</h1>
                <p className="mt-4 text-gray-600">Job listings will be available here</p>
              </div>
            </ProtectedRoute>
          } />

          <Route path="messages" element={
            <ProtectedRoute>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Messages - Coming Soon!</h1>
                <p className="mt-4 text-gray-600">Direct messaging will be available here</p>
              </div>
            </ProtectedRoute>
          } />

          <Route path="profile" element={
            <ProtectedRoute>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Profile - Coming Soon!</h1>
                <p className="mt-4 text-gray-600">User profile management will be available here</p>
              </div>
            </ProtectedRoute>
          } />

          <Route path="settings" element={
            <ProtectedRoute>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Settings - Coming Soon!</h1>
                <p className="mt-4 text-gray-600">Account settings will be available here</p>
              </div>
            </ProtectedRoute>
          } />
        </Route>
        {/* You can add routes without layout here if needed */}
        {/* <Route path="/admin" element={<AdminPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;