import React from 'react'
import Logo from '../assets/Logo.jpeg'
import { useNavigate } from 'react-router-dom';
import './Home.css'

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };
  return (
    <div className="home-container">
      <img src={Logo} alt="Logo" className="logo" />
      <h3 className="app-name">Never miss the moment that sparks innovation.</h3>
      <button className="get-started-btn" onClick={handleGetStarted}>
        Get Started
      </button>
    </div>
  );
}
export default Home
