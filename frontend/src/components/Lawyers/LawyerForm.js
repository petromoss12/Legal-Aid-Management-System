import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LawyerForm.css';

function LawyerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    provider_type: '',
    registration_status: '',
    license_status: '',
    phone: '',
    email: '',
    website: '',
    mode_of_operation: '',
    verified: false,
    locations: [{ region: '', district: '', ward: '', village: '', street: '' }],
    areas_of_law: [],
    services: [],
    target_clients: []
  });

  const [options, setOptions] = useState({
    areasOfLaw: [],
    services: [],
    targetClients: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOptions();
    if (isEdit) {
      fetchLawyer();
    }
  }, [id]);

  const fetchOptions = async () => {
    // In a real app, you'd fetch these from the API
    setOptions({
      areasOfLaw: ['Criminal Law', 'Civil Law', 'Family Law', 'Commercial Law', 'Constitutional Law', 'Labor Law', 'Property Law', 'Immigration Law'],
      services: ['Legal Representation', 'Legal Advice/Counselling', 'Mediation/ADR', 'Legal Education', 'Document Drafting'],
      targetClients: ['Women', 'Children', 'Persons with Disabilities', 'Prisoners', 'Refugees', 'General Public']
    });
  };

  const fetchLawyer = async () => {
    try {
      const response = await api.get(`/lawyers/${id}`);
      const lawyer = response.data;
      
      setFormData({
        name: lawyer.name || '',
        provider_type: lawyer.provider_type || '',
        registration_status: lawyer.registration_status || '',
        license_status: lawyer.license_status || '',
        phone: lawyer.phone || '',
        email: lawyer.email || '',
        website: lawyer.website || '',
        mode_of_operation: lawyer.mode_of_operation || '',
        verified: lawyer.verified || false,
        locations: lawyer.locations && lawyer.locations.length > 0 
          ? lawyer.locations 
          : [{ region: '', district: '', ward: '', village: '', street: '' }],
        areas_of_law: lawyer.areas_of_law || [],
        services: lawyer.services || [],
        target_clients: lawyer.target_clients || []
      });
    } catch (error) {
      toast.error('Error fetching lawyer data');
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationChange = (index, field, value) => {
    const newLocations = [...formData.locations];
    newLocations[index][field] = value;
    setFormData(prev => ({ ...prev, locations: newLocations }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { region: '', district: '', ward: '', village: '', street: '' }]
    }));
  };

  const removeLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleAreaOfLawChange = (areaName, percentage) => {
    const newAreas = [...formData.areas_of_law];
    const index = newAreas.findIndex(a => a.area_name === areaName);
    
    if (index >= 0) {
      if (percentage > 0) {
        newAreas[index].case_percentage = parseInt(percentage);
      } else {
        newAreas.splice(index, 1);
      }
    } else if (percentage > 0) {
      newAreas.push({ area_name: areaName, case_percentage: parseInt(percentage) });
    }
    
    setFormData(prev => ({ ...prev, areas_of_law: newAreas }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleTargetClientToggle = (client) => {
    setFormData(prev => ({
      ...prev,
      target_clients: prev.target_clients.includes(client)
        ? prev.target_clients.filter(c => c !== client)
        : [...prev.target_clients, client]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log the request details
      const endpoint = isEdit ? `/lawyers/${id}` : '/lawyers/index.php';
      const method = isEdit ? 'PUT' : 'POST';
      console.log(`Making ${method} request to: ${api.defaults.baseURL}${endpoint}`);

      let response;
      if (isEdit) {
        response = await api.put(`/lawyers/${id}`, formData);
      } else {
        // Use direct endpoint to bypass router issues
        response = await api.post('/lawyers/index.php', formData);
      }

      // Success - show message and navigate
      toast.success(isEdit ? 'Lawyer profile updated successfully' : 'Lawyer profile created successfully');
      navigate('/lawyers');
      
    } catch (error) {
      console.error('Error saving lawyer:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMessage = 'Error saving lawyer profile';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        // Only show error if it's actually an error status (not 2xx)
        if (status >= 200 && status < 300) {
          // This is actually a success response, treat it as success
          toast.success(isEdit ? 'Lawyer profile updated successfully' : 'Lawyer profile created successfully');
          navigate('/lawyers');
          return;
        }
        errorMessage = error.response.data?.message || `Server error: ${status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Cannot reach backend server. Please ensure XAMPP Apache is running.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      // Only show error toast if it's a real error
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>{isEdit ? 'Edit Lawyer Profile' : 'Create New Lawyer Profile'}</h1>

      <form onSubmit={handleSubmit} className="lawyer-form">
        <div className="card">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Provider Type *</label>
              <select
                name="provider_type"
                value={formData.provider_type}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                <option value="Law firm">Law firm</option>
                <option value="NGO">NGO</option>
                <option value="Paralegal">Paralegal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Registration Status</label>
              <input
                type="text"
                name="registration_status"
                value={formData.registration_status}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>License Status</label>
              <select
                name="license_status"
                value={formData.license_status}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mode of Operation</label>
              <select
                name="mode_of_operation"
                value={formData.mode_of_operation}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                <option value="PERMANENT">Permanent</option>
                <option value="MOBILE">Mobile</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={handleChange}
                />
                Verified
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="card">
          <h3>Geographical Coverage</h3>
          {formData.locations.map((location, index) => (
            <div key={index} className="location-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Region *</label>
                  <input
                    type="text"
                    value={location.region}
                    onChange={(e) => handleLocationChange(index, 'region', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input
                    type="text"
                    value={location.district}
                    onChange={(e) => handleLocationChange(index, 'district', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ward</label>
                  <input
                    type="text"
                    value={location.ward}
                    onChange={(e) => handleLocationChange(index, 'ward', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Village</label>
                  <input
                    type="text"
                    value={location.village}
                    onChange={(e) => handleLocationChange(index, 'village', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    value={location.street}
                    onChange={(e) => handleLocationChange(index, 'street', e.target.value)}
                  />
                </div>
              </div>
              {formData.locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  className="btn btn-danger"
                  style={{ marginTop: '10px' }}
                >
                  Remove Location
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addLocation} className="btn btn-secondary">
            Add Another Location
          </button>
        </div>

        <div className="card">
          <h3>Areas of Law (with case percentage)</h3>
          {options.areasOfLaw.map(area => {
            const existing = formData.areas_of_law.find(a => a.area_name === area);
            return (
              <div key={area} className="form-row" style={{ alignItems: 'center' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{area}</label>
                </div>
                <div className="form-group" style={{ width: '150px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={existing?.case_percentage || 0}
                    onChange={(e) => handleAreaOfLawChange(area, e.target.value)}
                    placeholder="Percentage"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3>Services Offered</h3>
          {options.services.map(service => (
            <div key={service} className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.services.includes(service)}
                  onChange={() => handleServiceToggle(service)}
                />
                {service}
              </label>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Target Clients</h3>
          {options.targetClients.map(client => (
            <div key={client} className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.target_clients.includes(client)}
                  onChange={() => handleTargetClientToggle(client)}
                />
                {client}
              </label>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Profile' : 'Create Profile')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/lawyers')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default LawyerForm;

