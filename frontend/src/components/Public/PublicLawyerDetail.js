import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './PublicLawyerDetail.css';

function PublicLawyerDetail() {
  const { id } = useParams();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyer();
  }, [id]);

  const fetchLawyer = async () => {
    try {
      const response = await api.get(`lawyers/${id}/`);
      console.log('Public Lawyer fetch response:', response.data);
      setLawyer(response.data);
    } catch (error) {
      console.error('Error fetching lawyer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (!lawyer) {
    return <div className="container"><div className="error">Lawyer not found</div></div>;
  }

  return (
    <div className="container">
      <div className="lawyer-detail">
        <div className="lawyer-header">
          <h1>{lawyer.name}</h1>
          <div className="lawyer-badges">
            {lawyer.verified && <span className="badge badge-info">Verified</span>}
          </div>
        </div>

        <div className="lawyer-info-grid">
          <div className="card">
            <h3>Basic Information</h3>
            <p><strong>Provider Type:</strong> {lawyer.provider_type}</p>
            <p><strong>Registration Status:</strong> {lawyer.registration_status || 'N/A'}</p>
            
            {lawyer.registration_status === 'Registered with MoCLA' && (
              <>
                <p><strong>Registration Year:</strong> {lawyer.registration_year || 'N/A'}</p>
                <p><strong>Registration Number:</strong> {lawyer.registration_number || 'N/A'}</p>
              </>
            )}
            
            {lawyer.registration_status === 'In Process' && (
              <>
                <p><strong>Registration Stage:</strong> {lawyer.registration_stage || 'N/A'}</p>
                <p><strong>Has the Registration Process taken more than 21 days:</strong> {lawyer.process_more_than_21_days || 'N/A'}</p>
                {lawyer.process_more_than_21_days === 'yes' && (
                  <p><strong>Registration Process Days:</strong> {lawyer.process_days || 'N/A'}</p>
                )}
                {lawyer.process_more_than_21_days === 'no' && (
                  <p><strong>Did Registrar Respond within 21 days:</strong> {lawyer.registrar_responded_in_21_days || 'N/A'}</p>
                )}
                {lawyer.registrar_responded_in_21_days === 'yes' && (
                  <p><strong>Time Taken to Respond to Registrar (days):</strong> {lawyer.respond_to_registrar_days || 'N/A'}</p>
                )}
              </>
            )}
            
            <p><strong>License Status:</strong> 
              {lawyer.license_status && (
                <span className={`badge ${lawyer.license_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  {lawyer.license_status}
                </span>
              )}
            </p>
            <p><strong>Mode of Operation:</strong> {lawyer.mode_of_operation}</p>
          </div>

          <div className="card">
            <h3>Contact Information</h3>
            {lawyer.phone && (
              <p>
                <strong>Phone:</strong>{' '}
                <a href={`tel:${lawyer.phone}`}>{lawyer.phone}</a>
              </p>
            )}
            {lawyer.email && (
              <p>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${lawyer.email}`}>{lawyer.email}</a>
              </p>
            )}
            {lawyer.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a href={lawyer.website} target="_blank" rel="noopener noreferrer">
                  {lawyer.website}
                </a>
              </p>
            )}
          </div>
        </div>

        {lawyer.locations && lawyer.locations.length > 0 && (
          <div className="card">
            <h3>Geographical Coverage</h3>
            {lawyer.locations.map((loc, idx) => (
              <div key={idx} className="location-item">
                <p>
                  {loc.region}
                  {loc.district && `, ${loc.district}`}
                  {loc.ward && `, ${loc.ward}`}
                  {loc.village && `, ${loc.village}`}
                  {loc.street && `, ${loc.street}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {lawyer.areas_of_law && lawyer.areas_of_law.length > 0 && (
          <div className="card">
            <h3>Areas of Law</h3>
            <div className="areas-list">
              {lawyer.areas_of_law.map((area, idx) => (
                <div key={idx} className="area-item">
                  <span className="area-name">{area.area_name}</span>
                  {/* <span className="area-percentage">{area.case_percentage}%</span> */}
                </div>
              ))}
            </div>
          </div>
        )}

        {lawyer.services && lawyer.services.length > 0 && (
          <div className="card">
            <h3>Services Offered</h3>
            <ul className="services-list">
              {lawyer.services.map((service, idx) => (
                <li key={idx}>{service}</li>
              ))}
            </ul>
          </div>
        )}

        {lawyer.target_clients && lawyer.target_clients.length > 0 && (
          <div className="card">
            <h3>Target Clients</h3>
            <div className="clients-list">
              {lawyer.target_clients.map((client, idx) => (
                <span key={idx} className="badge badge-info">{client}</span>
              ))}
            </div>
          </div>
        )}

        {lawyer.staff && lawyer.staff.length > 0 && (
          <div className="card">
            <h3>Staff</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Specialization</th>
                  <th>Years of Practice</th>
                </tr>
              </thead>
              <tbody>
                {lawyer.staff.map((member) => (
                  <tr key={member.staff_id}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>{member.specialization || 'N/A'}</td>
                    <td>{member.years_of_practice || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicLawyerDetail;

