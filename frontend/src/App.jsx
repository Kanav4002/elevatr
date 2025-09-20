import RegisterPage from './(Auth)/register/RegisterPage';
import './App.css';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/register" element={<RegisterPage/>}/>
        </Routes>
      </Router>
    </>
  );
}

export default App
