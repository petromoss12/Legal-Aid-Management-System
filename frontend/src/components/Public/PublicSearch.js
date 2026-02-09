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
    license_status: ''
  });
  const [options, setOptions] = useState({
    regions: [],
    areasOfLaw: [],
    services: []
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
      // Fetch available options for filters
      const [regionsRes, areasRes, servicesRes] = await Promise.all([
        api.get('/lawyers?limit=1000'),
        api.get('/lawyers?limit=1000'),
        api.get('/lawyers?limit=1000')
      ]);

      const allLawyers = regionsRes.data.data || [];
      const uniqueRegions = [...new Set(allLawyers.flatMap(l => 
        l.locations?.map(loc => loc.region) || []
      ))].filter(Boolean);

      const uniqueAreas = [...new Set(allLawyers.flatMap(l => 
        l.areas_of_law?.map(a => a.area_name) || []
      ))].filter(Boolean);

      const uniqueServices = [...new Set(allLawyers.flatMap(l => 
        l.services || []
      ))].filter(Boolean);

      setOptions({
        regions: uniqueRegions,
        areasOfLaw: uniqueAreas,
        services: uniqueServices
      });
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/lawyers?${params.toString()}`);
      setLawyers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
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

              <Link to={`/lawyer/${lawyer.lawyer_id}`} className="btn btn-primary">
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

