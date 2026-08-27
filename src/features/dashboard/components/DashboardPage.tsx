import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../shared/api/axiosInstance';
import { Calendar, Car, Wallet, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => {
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">Loading dashboard...</div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center text-red-500">Error loading data.</div>
    );
  }

  const { fleet, reservations, recentReservations, alerts, monthlyStats } =
    dashboardData;

  const totalVehicles = fleet.total || 1;
  const availablePct = Math.round((fleet.available / totalVehicles) * 100);
  const rentedPct = Math.round((fleet.rented / totalVehicles) * 100);
  const maintenancePct = Math.round((fleet.maintenance / totalVehicles) * 100);

  // Données filtrées pour le diagramme circulaire avec "Available" en vert
  const fleetData = [
    { name: 'Available', value: fleet.available, color: '#10b981' }, // Vert (Emerald)
    { name: 'Rented', value: fleet.rented, color: '#3b82f6' },       // Bleu électrique
    { name: 'Maintenance', value: fleet.maintenance, color: '#fbbf24' }, // Jaune/Amber
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hello, Administrator 👋
          </h1>
          <p className="text-sm text-slate-500">
            Here is your agency's activity today
          </p>
        </div>
      </div>

      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Reservations
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {reservations.totalReservations}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Vehicles
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {fleet.available}
              </span>
              <span className="text-xs text-slate-400">
                out of {fleet.total} vehicles
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {reservations.pendingReservations}
            </span>
            <span className="text-xs text-slate-400 ml-2">to process</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partner Agencies
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {dashboardData.agenciesCount}
            </span>
          </div>
        </div>
      </div>

      {/* ALERTS SECTION (Dynamic) */}
      {alerts && alerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Alerts & Deadlines requiring your attention ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-white p-3.5 rounded-xl border border-amber-100 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {alert.message}
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                    Due Date: {alert.dueDate}
                  </span>
                </div>
                {alert.vehicle && (
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-medium text-slate-800">
                      {alert.vehicle.brand} {alert.vehicle.model}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {alert.vehicle.licensePlate}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. FLEET STATUS & CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Revenue and Reservations</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              Last 12 months ▾
            </span>
          </div>
          
          {/* RECHARTS AREA CHART */}
          <div className="h-64 w-full">
            {monthlyStats && monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyStats}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      borderColor: '#f1f5f9',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'total_revenue' ? `$${parseFloat(value || 0).toFixed(2)}` : value,
                      name === 'total_revenue' ? 'Revenue' : 'Reservations',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="total_reservations"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReservations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* FLEET STATUS (VRAI PIECHART RECHARTS) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 mb-4">Fleet Status</h3>
          
          <div className="relative h-40 w-full flex items-center justify-center my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={fleetData.length > 1 ? 5 : 0}
                  dataKey="value"
                >
                  {fleetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Total au centre du donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">
                {fleet.total}
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Vehicles
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{' '}
                Available
              </span>
              <span className="font-bold text-slate-900">
                {fleet.available} ({availablePct}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{' '}
                Rented
              </span>
              <span className="font-bold text-slate-900">
                {fleet.rented} ({rentedPct}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>{' '}
                Maintenance
              </span>
              <span className="font-bold text-slate-900">
                {fleet.maintenance} ({maintenancePct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT RESERVATIONS TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Recent Reservations</h3>
          <Link
            to="/reservations"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Client</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Start Date</th>
                <th className="pb-3">End Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {recentReservations.map((res: any) => (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3.5 font-medium text-slate-900">
                    {res.client ? res.client.email : 'Unknown client'}
                  </td>
                  <td className="py-3.5">
                    <div className="font-medium text-slate-900">
                      {res.vehicle
                        ? `${res.vehicle.brand} ${res.vehicle.model}`
                        : 'Deleted vehicle'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {res.vehicle?.licensePlate}
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{res.startDate}</td>
                  <td className="py-3.5 text-slate-600">{res.endDate}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};