import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './PublicSearch.css';

function PublicSearch() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    area_of_law: '',
    service: '',
    license_status: '',
    provider_type: ''
  });
  const [options, setOptions] = useState({
    regions: [],
    areasOfLaw: [],
    services: [],
    providerTypes: []
  });

  useEffect(() => {
    fetchOptions();
    fetchLawyers();
  }, []);

  useEffect(() => {
    fetchLawyers();
  }, [filters]);

  const fetchOptions = async () => {
    try {
      // Fetch lookup data (service types, areas of law, etc.)
      let areasOfLaw = [];
      let services = [];
      
      try {
        const lookupRes = await api.get('lookup');
        const lookupData = lookupRes.data;
        console.log('Lookup data:', lookupData);

        areasOfLaw = lookupData.areasOfLaw?.map(item => item.area_name) || [];
        services = lookupData.services?.map(item => item.service_name) || [];
        console.log('Areas of Law from lookup:', areasOfLaw);
        console.log('Services from lookup:', services);
      } catch (lookupError) {
        console.error('Lookup API error, using fallback:', lookupError);
        // Fallback areas of law if API fails
        areasOfLaw = ['Criminal Law', 'Civil Law', 'Family Law', 'Commercial Law', 'Constitutional Law', 'Labor Law', 'Property Law', 'Immigration Law'];
        // Fallback services if API fails
        services = ['Legal Representation', 'Legal Advice/Counselling', 'Mediation/ADR', 'Legal Education', 'Document Drafting'];
      }

      // Provider types - hardcoded as they don't come from lookup
      const providerTypes = [
        'Law firm',
        'NGO',
        'Paralegal',
        'CSO',
        'CBO',
        'FBO',
        'Academic/Training Institution',
        'Mandated Stakeholders',
        'Other'
      ];

      // Fetch lawyers to get available regions
      let uniqueRegions = [];
      try {
        const lawyersRes = await api.get('lawyers?limit=1000');
        const allLawyers = lawyersRes.data.data || [];
        console.log('All lawyers:', allLawyers);
        uniqueRegions = [...new Set(allLawyers.flatMap(l => 
          l.locations?.map(loc => loc.region) || []
        ))].filter(Boolean).sort();
        console.log('Regions:', uniqueRegions);
      } catch (lawyersError) {
        console.error('Lawyers API error:', lawyersError);
        uniqueRegions = [];
      }

      const finalOptions = {
        regions: uniqueRegions,
        areasOfLaw: areasOfLaw,
        services: services,
        providerTypes: providerTypes
      };
      
      console.log('Final options:', finalOptions);
      setOptions(finalOptions);
      console.log('Options set successfully');
    } catch (error) {
      console.error('Error in fetchOptions:', error);
    }
  };

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const queryString = params.toString();
      const fullUrl = `${api.defaults.baseURL}/lawyers?${queryString}`;
      console.log('Fetching lawyers from:', fullUrl);
      console.log('Axios baseURL:', api.defaults.baseURL);
      console.log('Axios headers:', api.defaults.headers);

      const response = await api.get(`lawyers/?${params.toString()}`);
      console.log('Lawyers response received:', response.data);
      setLawyers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error config:', error.config);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container">
      <div className="search-header">
        <h1>Find Legal Aid Providers</h1>
        <p>Search for lawyers, law firms, and legal aid organizations</p>
      </div>

      <div className="card">
        <div className="filters">
          <div className="form-group">
            <label>Search by Name or Email</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Enter name or email..."
            />
          </div>

          <div className="form-group">
            <label>Provider Type</label>
            <select
              value={filters.provider_type}
              onChange={(e) => handleFilterChange('provider_type', e.target.value)}
            >
              <option value="">All Types</option>
              {options.providerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}

            </select>
          </div>

          <div className="form-group">
            <label>Region</label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="">All Regions</option>
              {options.regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Area of Law</label>
            <select
              value={filters.area_of_law}
              onChange={(e) => handleFilterChange('area_of_law', e.target.value)}
            >
              <option value="">All Areas</option>
              {options.areasOfLaw.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Service Type</label>
            <select
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
            >
              <option value="">All Services</option>
              {options.services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>License Status</label>
            <select
              value={filters.license_status}
              onChange={(e) => handleFilterChange('license_status', e.target.value)}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="lawyers-grid">
          {lawyers.map(lawyer => (
            <div key={lawyer.lawyer_id} className="lawyer-card">
              <h3>{lawyer.name}</h3>
              <p className="lawyer-type">{lawyer.provider_type}</p>
              
              <div className="lawyer-info">
                {lawyer.license_status && (
                  <span className={`badge ${lawyer.license_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {lawyer.license_status}
                  </span>
                )}
                {lawyer.verified && (
                  <span className="badge badge-info">Verified</span>
                )}
              </div>

              {lawyer.locations && lawyer.locations.length > 0 && (
                <p className="lawyer-location">
                  📍 {lawyer.locations[0].region}
                  {lawyer.locations[0].district && `, ${lawyer.locations[0].district}`}
                </p>
              )}

              {lawyer.phone && (
                <p className="lawyer-contact">📞 {lawyer.phone}</p>
              )}

              {lawyer.email && (
                <p className="lawyer-contact">✉️ {lawyer.email}</p>
              )}

              <Link to={`/lawyer/${lawyer.lawyer_id}`}>
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && lawyers.length === 0 && (
        <div className="no-results">
          <p>No lawyers found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default PublicSearch;

