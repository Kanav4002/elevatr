import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => { // Changed from RegisterPage to LoginPage
  const [email, setEmail] = useState(''); // Removed name and role - not needed for login
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        email,
        password // Only email and password for login
      };
  
      const res = await axios.post("http://localhost:4000/api/auth/login", payload); // Changed to login endpoint

      if(res.status === 200) { // Login returns 200, not 201
        console.log('Login successful: ', res.data);
        
        // Use AuthContext login function 
        login(res.data.user, res.data.token);
        
        // Redirect to root page 
        navigate("/");
      }
    } catch (error) {
      console.error('Login error: ', error);
      // You can add error state here if needed
    }
  };
  
  return (
    <>
    <div className="text-3xl font-bold text-center mb-8 text-gray-800">Login Page</div>
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg space-y-6">
      <input 
        onChange={(e) => {setEmail(e.target.value)}}
        type="email" 
        name="email" 
        placeholder="Enter your email"
        value={email}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />
      <input 
        onChange={(e) => {setPassword(e.target.value)}}
        type="password" 
        name="password" 
        placeholder="Enter your password"
        value={password}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />
      
      <button 
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-semibold"
      >
        Login
      </button>
      
      {/* Optional: Add link to register page */}
      <div className="text-center mt-4">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Register here
          </button>
        </p>
      </div>
    </form>
    </>
  )
};

export default LoginPage;