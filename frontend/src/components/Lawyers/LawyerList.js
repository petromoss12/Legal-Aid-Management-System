import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LawyerList.css';

function LawyerList() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const response = await api.get('/lawyers/index.php?limit=1000');
      console.log('=== LAWYER FETCH DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response headers:', response.headers);
      
      // Log the exact raw response
      console.log('RAW RESPONSE:', response.data);
      
      let parsedData = response.data;
      
      // If response is a string, parse it as JSON
      if (typeof response.data === 'string') {
        console.log('String length:', response.data.length);
        // Find the first { and last }
        const firstBrace = response.data.indexOf('{');
        const lastBrace = response.data.lastIndexOf('}');
        console.log('First brace at:', firstBrace, 'Last brace at:', lastBrace);
        console.log('Before first brace:', JSON.stringify(response.data.substring(0, firstBrace)));
        console.log('After last brace:', JSON.stringify(response.data.substring(lastBrace + 1)));
        
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          const jsonString = response.data.substring(firstBrace, lastBrace + 1);
          parsedData = JSON.parse(jsonString);
        }
      }
      
      let lawyerData = [];
      if (parsedData && typeof parsedData === 'object') {
        if (Array.isArray(parsedData)) {
          lawyerData = parsedData;
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
          lawyerData = parsedData.data;
        }
      }
      
      console.log('Lawyer count:', lawyerData.length);
      setLawyers(Array.isArray(lawyerData) ? lawyerData : []);
    } catch (error) {
      console.error('=== ERROR FETCHING LAWYERS ===');
      console.error('Error:', error.message);
      console.error('Full error:', error);
      toast.error(error.response?.data?.message || 'Error fetching lawyers');
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (lawyerId, currentStatus) => {
    try {
      const payload = {
        verified: !currentStatus,
        update_description: `Profile ${!currentStatus ? 'verified' : 'unverified'}`
      };
      console.log('Sending verify PUT for lawyer', lawyerId, payload);
      const response = await api.put(`/lawyers/${lawyerId}`, payload);
      console.log('Verify response:', response);
      toast.success('Verification status updated');
      fetchLawyers();
    } catch (error) {
      console.error('Error updating verification status:', error.response?.data || error.message, error);
      toast.error(error.response?.data?.message || 'Error updating verification status');
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Lawyer Profiles</h1>
        {user?.role === 'ADMIN' && (
          <Link to="/lawyers/new" className="btn btn-primary">
            Add New Lawyer
          </Link>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider Type</th>
              <th>License Status</th>
              <th>Verified</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lawyers.map(lawyer => (
              <tr key={lawyer.lawyer_id}>
                <td>{lawyer.name}</td>
                <td>{lawyer.provider_type}</td>
                <td>
                  {lawyer.license_status && (
                    <span className={`badge ${lawyer.license_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {lawyer.license_status}
                    </span>
                  )}
                </td>
                <td>
                  {lawyer.verified ? (
                    <span className="badge badge-success">Yes</span>
                  ) : (
                    <span className="badge badge-warning">No</span>
                  )}
                </td>
                <td>{lawyer.email || 'N/A'}</td>
                <td>{lawyer.phone || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <Link
                      to={`/lawyers/${lawyer.lawyer_id}`}
                      className="btn btn-outline-secondary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      View
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <>
                        <Link
                          to={`/lawyers/${lawyer.lawyer_id}/edit`}
                          className="btn btn-outline-primary"
                          style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleVerify(lawyer.lawyer_id, lawyer.verified)}
                          className={`btn ${lawyer.verified ? 'btn-warning' : 'btn-success'}`}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          {lawyer.verified ? 'Unverify' : 'Verify'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LawyerList;

