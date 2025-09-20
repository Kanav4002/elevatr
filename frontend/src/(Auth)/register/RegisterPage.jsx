import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        name, 
        email,
        password,
        role,
      };
  
      const res = await axios.post("http://localhost:4000/api/auth/register", payload);

      if(res.status === 201) {
        console.log('Registration successful: ', res.data);
        navigate("/login");
      }
    } catch (error) {
      console.error('Registration error: ', error);
    }
  };
  
  // console.log(name, email, password);
  return (
    <>
    <div className="text-3xl font-bold text-center mb-8 text-gray-800">Register Page</div>
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg space-y-6">
      <input 
        onChange={(e) => {setName(e.target.value)}}
        type="text" 
        name="name" 
        placeholder="Enter your name"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />
      <input 
        onChange={(e) => {setEmail(e.target.value)}}
        type="email" 
        name="email" 
        placeholder="Enter your email"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />
      <input 
        onChange={(e) => {setPassword(e.target.value)}}
        type="password" 
        name="password" 
        placeholder="Enter your password"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Select Role:</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={(e) => setRole(e.target.value)}
              className="mr-2 text-blue-600"
            />
            Student
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="recruiter"
              checked={role === 'recruiter'}
              onChange={(e) => setRole(e.target.value)}
              className="mr-2 text-blue-600"
            />
            Recruiter
          </label>
        </div>
      </div>
      
      <button 
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-semibold"
      >
        Register
      </button>

      <div className='text-center mt-4'>
        <p className='text-gray-600'>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className='text-blue-600 hover:text-blue-800 font-semibold'
          >
            Login here
          </button>
        </p>
      </div>
    </form>
    </>
  )
};

export default RegisterPage;