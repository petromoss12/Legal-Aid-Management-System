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
    provider_type_other: '',
    registration_status: '',
    registration_year: '',
    registration_number: '',
    registration_stage: '',
    process_more_than_21_days: '',
    process_days: '',
    registrar_responded_in_21_days: '',
    respond_to_registrar_days: '',
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
    try {
      const response = await api.get('lookup');
      setOptions({
        areasOfLaw: response.data.areasOfLaw.map(item => item.area_name),
        services: response.data.services.map(item => item.service_name),
        targetClients: response.data.targetClients.map(item => item.client_type)
      });
    } catch (error) {
      console.error('Error fetching options:', error);
      // Fallback to hardcoded values if API fails
      setOptions({
        areasOfLaw: ['Criminal Law', 'Civil Law', 'Family Law', 'Commercial Law', 'Constitutional Law', 'Labor Law', 'Property Law', 'Immigration Law'],
        services: ['Legal Representation', 'Legal Advice/Counselling', 'Mediation/ADR', 'Legal Education', 'Document Drafting'],
        targetClients: ['Women', 'Children', 'Persons with Disabilities', 'Prisoners', 'Refugees', 'General Public']
      });
    }
  };

  const fetchLawyer = async () => {
    try {
      const response = await api.get(`lawyers/${id}/`);
      const lawyer = response.data;
      
      // Check if provider_type is a standard option or custom
      const standardProviderTypes = [
        'Law firm', 'NGO', 'Paralegal', 'CSO', 'CBO', 'FBO',
        'Academic/Training Institution', 'Mandated Stakeholders', 'Other'
      ];
      
      let provider_type = lawyer.provider_type || '';
      let provider_type_other = '';
      
      // If provider_type is not in the standard list, treat it as 'Other' with custom value
      if (provider_type && !standardProviderTypes.includes(provider_type)) {
        provider_type_other = provider_type;
        provider_type = 'Other';
      }
      
      setFormData({
        name: lawyer.name || '',
        provider_type: provider_type,
        provider_type_other: provider_type_other,
        registration_status: lawyer.registration_status || '',
        registration_year: lawyer.registration_year || '',
        registration_number: lawyer.registration_number || '',
        registration_stage: lawyer.registration_stage || '',
        process_more_than_21_days: lawyer.process_more_than_21_days || '',
        process_days: lawyer.process_days || '',
        registrar_responded_in_21_days: lawyer.registrar_responded_in_21_days || '',
        respond_to_registrar_days: lawyer.respond_to_registrar_days || '',
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

    // Validation: Check if selected registration_status requires specific fields to be filled
    if (formData.registration_status === 'Registered with MoCLA') {
      if (!formData.registration_year || !formData.registration_number) {
        toast.error('Please fill in Registration Year and Number for Registered status');
        setLoading(false);
        return;
      }
    } else if (formData.registration_status === 'In Process') {
      if (!formData.registration_stage) {
        toast.error('Please fill in the registration stage');
        setLoading(false);
        return;
      }
      if (!formData.process_more_than_21_days || formData.process_more_than_21_days < 0) {
        toast.error('Please answer: Has the process taken more than 21 days?');
        setLoading(false);
        return;
      }
      if (formData.process_more_than_21_days === 'yes' && !formData.process_days) {
        toast.error('Please enter the number of days');
        setLoading(false);
        return;
      }
      if (formData.process_more_than_21_days === 'no' && !formData.registrar_responded_in_21_days) {
        toast.error('Please answer: Did the registrar respond within 21 days?');
        setLoading(false);
        return;
      }
      if (formData.registrar_responded_in_21_days === 'yes' && !formData.respond_to_registrar_days) {
        toast.error('Please enter the number of days to respond to registrar');
        setLoading(false);
        return;
      }
    }

    try {
      // Log the request details
      const endpoint = isEdit ? `/lawyers/${id}` : '/lawyers/index.php';
      const method = isEdit ? 'PUT' : 'POST';
      console.log(`Making ${method} request to: ${api.defaults.baseURL}${endpoint}`);

      // Prepare payload - start with form data
      const payload = { ...formData };
      
      // Clear conditional fields based on registration_status
      if (payload.registration_status === 'Registered with MoCLA') {
        // Keep: registration_year, registration_number
        // Clear: In Process and Not Registered fields
        payload.registration_stage = '';
        payload.process_more_than_21_days = '';
        payload.process_days = null;
        payload.registrar_responded_in_21_days = '';
        payload.respond_to_registrar_days = null;
      } else if (payload.registration_status === 'In Process') {
        // Keep: registration_stage, process_more_than_21_days, process_days, registrar_responded_in_21_days, respond_to_registrar_days
        // Clear: Registered fields
        payload.registration_year = '';
        payload.registration_number = '';
      } else if (payload.registration_status === 'Not Registered') {
        // Clear all registration conditional fields
        payload.registration_year = '';
        payload.registration_number = '';
        payload.registration_stage = '';
        payload.process_more_than_21_days = '';
        payload.process_days = null;
        payload.registrar_responded_in_21_days = '';
        payload.respond_to_registrar_days = null;
      }
      
      // Convert numeric fields
      payload.process_days = payload.process_days ? parseInt(payload.process_days) : null;
      payload.respond_to_registrar_days = payload.respond_to_registrar_days ? parseInt(payload.respond_to_registrar_days) : null;

      let response;
      
      // Merge 'Other' provider type into provider_type before submit
      if (payload.provider_type_other && payload.provider_type_other.trim() !== '') {
        payload.provider_type = payload.provider_type_other.trim();
      }

      console.log('Payload being sent:', payload);

      if (isEdit) {
        response = await api.put(`lawyers/${id}/`, payload);
      } else {
        // Use direct endpoint to bypass router issues
        response = await api.post('lawyers/', payload);
      }

      console.log('Response from backend:', response);

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
    <>
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
                <option value="CSO">CSO</option>
                <option value="CBO">CBO</option>
                <option value="FBO">FBO</option>
                <option value="Academic/Training Institution">Academic/Training Institution</option>
                <option value="Mandated Stakeholders">Mandated Stakeholders e.g. TLS</option>
                <option value="Other">Other</option>

              </select>
            </div>
          </div>

          {formData.provider_type === 'Other' && (
            <div className="form-row">
              <div className="form-group">
                <label>Specify Provider Type</label>
                <input
                  type="text"
                  name="provider_type_other"
                  value={formData.provider_type_other}
                  onChange={handleChange}
                  placeholder="Enter provider type"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Registration Status</label>
              <select 
                name="registration_status"
                value={formData.registration_status}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                <option value="Registered with MoCLA">Registered with MoCLA</option>
                <option value="In Process">In process of registration</option>
                <option value="Not Registered">Not registered</option>
              </select>
            </div>
          </div>

          {formData.registration_status === 'Registered with MoCLA' && (
            <div className="form-row">
              <div className="form-group">
                <label>Registration Year *</label>
                <input
                  type="text"
                  name="registration_year"
                  value={formData.registration_year}
                  onChange={handleChange}
                  placeholder="e.g., 2020"
                  required
                />
              </div>
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="Enter registration number"
                  required
                />
              </div>
            </div>
          )}
          
          {formData.registration_status === 'In Process' && (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label>What stage is your registration at? *</label>
                  <input
                    type="text"
                    name="registration_stage"
                    value={formData.registration_stage}
                    onChange={handleChange}
                    placeholder="Describe current stage"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Has the process taken more than 21 days? *</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                    <label>
                      <input
                        type="radio"
                        name="process_more_than_21_days"
                        value="yes"
                        checked={formData.process_more_than_21_days === 'yes'}
                        onChange={handleChange}
                        required
                      />
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="process_more_than_21_days"
                        value="no"
                        checked={formData.process_more_than_21_days === 'no'}
                        onChange={handleChange}
                        required
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              {formData.process_more_than_21_days === 'yes' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>How many days did it take? *</label>
                    <input
                      type="number"
                      name="process_days"
                      value={formData.process_days}
                      onChange={handleChange}
                      placeholder="Enter number of days"
                      min="0"
                      required
                    />
                  </div>
                </div>
              )}

              {formData.process_more_than_21_days === 'no' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Did the registrar respond (request for clarification or other communication) within 21 days of your application submission? *</label>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                      <label>
                        <input
                          type="radio"
                          name="registrar_responded_in_21_days"
                          value="yes"
                          checked={formData.registrar_responded_in_21_days === 'yes'}
                          onChange={handleChange}
                          required
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="registrar_responded_in_21_days"
                          value="no"
                          checked={formData.registrar_responded_in_21_days === 'no'}
                          onChange={handleChange}
                          required
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {formData.registrar_responded_in_21_days === 'yes' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Approximately how long did you take to respond to the registrar's request(s)? (in days) *</label>
                    <input
                      type="number"
                      name="respond_to_registrar_days"
                      value={formData.respond_to_registrar_days}
                      onChange={handleChange}
                      placeholder="Enter number of days"
                      min="0"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="form-row">
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
              <label>Verified</label>
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={handleChange}
                />
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
    </>
  );
}

export default LawyerForm;

