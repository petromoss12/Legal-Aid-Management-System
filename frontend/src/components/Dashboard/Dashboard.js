import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [lawyersByRegion, setLawyersByRegion] = useState([]);
  const [areasOfLaw, setAreasOfLaw] = useState([]);
  const [licenseStatus, setLicenseStatus] = useState([]);
  const [fundingData, setFundingData] = useState([]);
  const [reportingStatus, setReportingStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard mounted, user:', user);
    if (user && user.role === 'ADMIN') {
      fetchDashboardData();
    } else if (user) {
      console.warn('User is not admin, dashboard data will not be fetched');
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [
        overviewRes,
        regionRes,
        areasRes,
        licenseRes,
        fundingRes,
        reportingRes
      ] = await Promise.all([
        api.get('/dashboard/reports?type=overview'),
        api.get('/dashboard/reports?type=lawyers_by_region'),
        api.get('/dashboard/reports?type=areas_of_law_coverage'),
        api.get('/dashboard/reports?type=license_status'),
        api.get('/dashboard/reports?type=funding_distribution'),
        api.get('/dashboard/reports?type=reporting_status')
      ]);

      console.log('Overview response:', overviewRes);
      console.log('Region response:', regionRes);
      console.log('Areas response:', areasRes);
      console.log('License response:', licenseRes);
      console.log('Funding response:', fundingRes);
      console.log('Reporting response:', reportingRes);

      setOverview(overviewRes.data?.data ?? null);
      setLawyersByRegion(regionRes.data?.data ?? []);
      setAreasOfLaw(areasRes.data?.data ?? []);
      setLicenseStatus(licenseRes.data?.data ?? []);
      setFundingData(fundingRes.data?.data ?? []);
      setReportingStatus(reportingRes.data?.data ?? []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading dashboard...</div></div>;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container">
        <div className="error">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {overview && (
        <div className="overview-cards">
          <div className="overview-card">
            <h3>Total Lawyers</h3>
            <p className="overview-number">{overview.total_lawyers}</p>
          </div>
          <div className="overview-card">
            <h3>Active Licenses</h3>
            <p className="overview-number">{overview.active_licenses}</p>
          </div>
          <div className="overview-card">
            <h3>Verified Profiles</h3>
            <p className="overview-number">{overview.verified_profiles}</p>
          </div>
          <div className="overview-card">
            <h3>Total Staff</h3>
            <p className="overview-number">{overview.total_staff}</p>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {lawyersByRegion.length > 0 && (
          <div className="card chart-card">
            <h3>Lawyers by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lawyersByRegion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {licenseStatus.length > 0 && (
          <div className="card chart-card">
            <h3>License Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={licenseStatus}
                  dataKey="count"
                  nameKey="license_status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {licenseStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {areasOfLaw.length > 0 && (
          <div className="card chart-card">
            <h3>Areas of Law Coverage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areasOfLaw} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="area_name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="lawyer_count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {fundingData.length > 0 && (
          <div className="card chart-card">
            <h3>Funding Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fundingData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_funding" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <a
            href="/scan/backend/api/export/export.php?format=csv&type=lawyers"
            className="btn btn-outline-primary"
            target="_blank"
          >
            Export Lawyers (CSV)
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

