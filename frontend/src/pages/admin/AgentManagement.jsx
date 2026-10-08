import React, { useState, useEffect } from 'react';
import { getAgentsApi, createAgentApi, updateAgentApi } from '../../api/client';
import Modal from '../../components/Modal';
import { Users, Plus, Edit2, CheckCircle2, XCircle, Search, UserCheck, UserX } from 'lucide-react';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [team, setTeam] = useState('Operations');
  const [status, setStatus] = useState('Active');

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchAgents = () => {
    setLoading(true);
    getAgentsApi()
      .then((res) => setAgents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openAddModal = () => {
    setEditingAgent(null);
    setName('');
    setEmployeeId(`FB00${agents.length + 1}`);
    setEmail('');
    setMobileNumber('');
    setTeam('Operations');
    setStatus('Active');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setEmployeeId(agent.employeeId);
    setEmail(agent.email);
    setMobileNumber(agent.mobileNumber || '');
    setTeam(agent.team || 'Operations');
    setStatus(agent.status);
    setFormError('');
    setShowModal(true);
  };

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateAgentApi(agent._id, { status: newStatus });
      fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !employeeId || !email) {
      setFormError('Agent Name, Employee ID, and Email are required.');
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        name,
        employeeId,
        email,
        mobileNumber,
        team,
        status
      };

      if (editingAgent) {
        await updateAgentApi(editingAgent._id, payload);
      } else {
        await createAgentApi(payload);
      }

      setShowModal(false);
      fetchAgents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving agent data.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredAgents = agents.filter((ag) => {
    const s = search.toLowerCase();
    return (
      ag.name.toLowerCase().includes(s) ||
      ag.employeeId.toLowerCase().includes(s) ||
      ag.email.toLowerCase().includes(s) ||
      ag.team.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agent Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">Manage company agents, teams, and active submission eligibility</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-800 transition-all"
        >
          <Plus className="h-4 w-4" /> + Add New Agent
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agent by name, employee ID, team, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary-900"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading agents directory...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No agents found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                <tr>
                  <th className="py-3.5 px-4">Agent Name</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAgents.map((ag) => (
                  <tr key={ag._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{ag.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-primary-900 whitespace-nowrap">{ag.employeeId}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{ag.email}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{ag.mobileNumber || '-'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {ag.team}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ag.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ag)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(ag)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                            ag.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {ag.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Agent Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAgent ? `Edit Agent - ${editingAgent.name}` : 'Add New Agent'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agent Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
              placeholder="e.g. Lahari"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee ID *</label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
              placeholder="e.g. FB001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
              placeholder="agent@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Team</label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
                placeholder="Operations"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-primary-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 rounded-xl bg-primary-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-800 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingAgent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentManagement;
