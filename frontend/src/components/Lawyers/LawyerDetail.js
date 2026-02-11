import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './LawyerDetail.css';

function LawyerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyer();
  }, [id]);

  const fetchLawyer = async () => {
    try {
      const response = await api.get(`/lawyers/${id}`);
      console.log('Lawyer fetch response:', response.data);
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
      <div className="detail-header">
        <h1>{lawyer.name}</h1>
        {user?.role === 'ADMIN' && (
          <Link to={`/lawyers/${id}/edit`} className="btn btn-primary">
            Edit Profile
          </Link>
        )}
      </div>

      <div className="detail-content">
        <div className="card">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div><strong>Provider Type:</strong> {lawyer.provider_type}</div>
            <div><strong>Registration Status:</strong> {lawyer.registration_status || 'N/A'}</div>
            
            {lawyer.registration_status === 'Registered with MoCLA' && (
              <>
                <div><strong>Registration Year:</strong> {lawyer.registration_year || 'N/A'}</div>
                <div><strong>Registration Number:</strong> {lawyer.registration_number || 'N/A'}</div>
              </>
            )}
            
            {lawyer.registration_status === 'In Process' && (
              <>
                <div><strong>Registration Stage:</strong> {lawyer.registration_stage || 'N/A'}</div>
                <div><strong>Has the Registration Process taken more than 21 days:</strong> {lawyer.process_more_than_21_days || 'N/A'}</div>
                {lawyer.process_more_than_21_days === 'yes' && (
                  <div><strong>Registration Process Days:</strong> {lawyer.process_days || 'N/A'}</div>
                )}
                {lawyer.process_more_than_21_days === 'no' && (
                  <div><strong>Did Registrar Respond within 21 days:</strong> {lawyer.registrar_responded_in_21_days || 'N/A'}</div>
                )}
                {lawyer.registrar_responded_in_21_days === 'yes' && (
                  <div><strong>Time Taken to Respond to Registrar (days):</strong> {lawyer.respond_to_registrar_days || 'N/A'}</div>
                )}
              </>
            )}
            
            <div><strong>License Status:</strong> 
              {lawyer.license_status && (
                <span className={`badge ${lawyer.license_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  {lawyer.license_status}
                </span>
              )}
            </div>
            <div><strong>Mode of Operation:</strong> {lawyer.mode_of_operation}</div>
            <div><strong>Verified:</strong> 
              {lawyer.verified ? (
                <span className="badge badge-success">Yes</span>
              ) : (
                <span className="badge badge-warning">No</span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Contact Information</h3>
          {lawyer.phone && <p><strong>Phone:</strong> <a href={`tel:${lawyer.phone}`}>{lawyer.phone}</a></p>}
          {lawyer.email && <p><strong>Email:</strong> <a href={`mailto:${lawyer.email}`}>{lawyer.email}</a></p>}
          {lawyer.website && <p><strong>Website:</strong> <a href={lawyer.website} target="_blank" rel="noopener noreferrer">{lawyer.website}</a></p>}
        </div>

        {lawyer.locations && lawyer.locations.length > 0 && (
          <div className="card">
            <h3>Geographical Coverage</h3>
            {lawyer.locations.map((loc, idx) => (
              <div key={idx} className="location-item">
                <p>{loc.region}{loc.district && `, ${loc.district}`}{loc.ward && `, ${loc.ward}`}{loc.village && `, ${loc.village}`}{loc.street && `, ${loc.street}`}</p>
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
                  <span>{area.area_name}</span>
                  {/* <span className="percentage">{area.case_percentage}%</span> */}
                </div>
              ))}
            </div>
          </div>
        )}

        {lawyer.services && lawyer.services.length > 0 && (
          <div className="card">
            <h3>Services Offered</h3>
            <ul>
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
            <h3>Staff Members</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Education</th>
                  <th>Specialization</th>
                  <th>Years of Practice</th>
                  <th>Certificate Status</th>
                </tr>
              </thead>
              <tbody>
                {lawyer.staff.map((member) => (
                  <tr key={member.staff_id}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>{member.gender || 'N/A'}</td>
                    <td>{member.age || 'N/A'}</td>
                    <td>{member.education_level || 'N/A'}</td>
                    <td>{member.specialization || 'N/A'}</td>
                    <td>{member.years_of_practice || 'N/A'}</td>
                    <td>{member.practicing_certificate_status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lawyer.funding && lawyer.funding.length > 0 && (
          <div className="card">
            <h3>Funding Information</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Adequacy</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {lawyer.funding.map((fund) => (
                  <tr key={fund.funding_id}>
                    <td>{fund.funding_source}</td>
                    <td>{fund.amount}</td>
                    <td>{fund.adequacy}</td>
                    <td>{fund.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lawyer.reports && lawyer.reports.length > 0 && (
          <div className="card">
            <h3>Reporting Information</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Frequency</th>
                  <th>Authority</th>
                  <th>Last Submitted</th>
                </tr>
              </thead>
              <tbody>
                {lawyer.reports.map((report) => (
                  <tr key={report.report_id}>
                    <td>{report.reporting_frequency}</td>
                    <td>{report.authority}</td>
                    <td>{report.last_submitted || 'N/A'}</td>
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

export default LawyerDetail;

