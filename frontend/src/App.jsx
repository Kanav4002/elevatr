import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './(Auth)/register/RegisterPage';
import LoginPage from './(Auth)/login/LoginPage';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
// import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer';
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
        </Route>
        
        {/* You can add routes without layout here if needed */}
        {/* <Route path="/admin" element={<AdminPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App
