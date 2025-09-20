import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './(Auth)/register/RegisterPage';
import LoginPage from './(Auth)/login/LoginPage';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './components/projects/AddProjects';
import ProjectsList from './components/projects/ProjectsList';
import EditProject from './components/projects/EditProject';
import ProjectsBrowse from './components/projects/ProjectsBrowse';
import Layout from './components/Layout';
import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Layout (Navbar + Footer) */}
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />

          <Route path="projects/new" element={
            <ProtectedRoute>
              <AddProject/>
            </ProtectedRoute>
          }/>

          <Route path="projects/my" element={
            <ProtectedRoute>
              <ProjectsList/>
            </ProtectedRoute>
          }/>

          <Route path="projects/:id/edit" element={
            <ProtectedRoute>
              <EditProject/>
            </ProtectedRoute>
          }/>

          <Route path="projects/browse" element={
            <ProtectedRoute>
              <ProjectsBrowse/>
            </ProtectedRoute>
          }/>
        </Route>
        {/* You can add routes without layout here if needed */}
        {/* <Route path="/admin" element={<AdminPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App
