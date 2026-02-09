import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            Legal Aid System
          </Link>
          
          <div className="navbar-links">
            {!user ? (
              <>
                <Link to="/">Search Lawyers</Link>
                <Link to="/login">Login</Link>
              </>
            ) : (
              <>
                {user.role === 'ADMIN' && (
                  <>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/lawyers">Lawyers</Link>
                    <Link to="/lawyers/new">Add Lawyer</Link>
                  </>
                )}
                <span className="navbar-user">Welcome, {user.username}</span>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

