import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Super simple emergency login page with minimal dependencies
const EmergencyLogin = () => {
  const [message, setMessage] = useState<string>('');
  const [, navigate] = useLocation();

  const loginAs = async (role: string) => {
    try {
      setMessage(`Attempting login as ${role}...`);
      
      // Clear any existing tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('testToken');
      
      // Set the token directly based on role
      const tokens: Record<string, string> = {
        admin: 'test-token-123456',
        restaurant: 'test-restaurant-token',
        restaurant2: 'test-restaurant2-token',
        influencer: 'test-influencer-token'
      };
      
      const token = tokens[role];
      if (!token) {
        setMessage(`Invalid role: ${role}`);
        return;
      }
      
      // Store the token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('testToken', token);
      
      // Try to get user data
      const response = await fetch('/api/user', {
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        const user = await response.json();
        setMessage(`Login successful! Logged in as ${user.name} (${user.role})`);
        
        // Add a delay to show the success message before redirecting
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };
  
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '20px', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#663399' }}>ViralBite Emergency Login</h1>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        Use this page to log in when the main login page isn't working.
      </p>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          background: message.includes('Error') ? '#ffebee' : '#e8f5e9', 
          border: message.includes('Error') ? '1px solid #ffcdd2' : '1px solid #c8e6c9',
          borderRadius: '4px',
          color: message.includes('Error') ? '#c62828' : '#2e7d32'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ display: 'grid', gridGap: '10px' }}>
        <button 
          onClick={() => loginAs('admin')} 
          style={{ 
            padding: '10px', 
            background: '#673ab7', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login as Admin
        </button>
        
        <button 
          onClick={() => loginAs('restaurant')} 
          style={{ 
            padding: '10px', 
            background: '#8e24aa', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login as Restaurant (johnjones)
        </button>
        
        <button 
          onClick={() => loginAs('restaurant2')} 
          style={{ 
            padding: '10px', 
            background: '#5e35b1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login as Restaurant2
        </button>
        
        <button 
          onClick={() => loginAs('influencer')} 
          style={{ 
            padding: '10px', 
            background: '#d81b60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login as Influencer (Janet)
        </button>
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
        This is a simple emergency login page that bypasses the normal login process.
      </p>
    </div>
  );
};

export default EmergencyLogin;