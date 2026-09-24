import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface Agency {
  id: string;
  name: string;
}

interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  category: string;
}

interface EmployeeRole {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  agency: Agency;
  employeeRole: EmployeeRole;
  createdAt: string;
}

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  agencyId: string;
  employeeRoleId: string;
  isActive: boolean;
}

interface RoleForm {
  name: string;
  description: string;
  permissionIds: number[];
}

interface PermissionForm {
  name: string;
  code: string;
  description: string;
  category: string;
}

const emptyForm: EmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  agencyId: '',
  employeeRoleId: '',
  isActive: true,
};

const emptyRoleForm: RoleForm = {
  name: '',
  description: '',
  permissionIds: [],
};

const emptyPermissionForm: PermissionForm = {
  name: '',
  code: '',
  description: '',
  category: '',
};

const selectClassName =
  'w-full appearance-none px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm outline-none cursor-pointer transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermission, setSavingPermission] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [editingRole, setEditingRole] =
    useState<EmployeeRole | null>(null);

  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [roleForm, setRoleForm] =
    useState<RoleForm>(emptyRoleForm);

  const [permissionForm, setPermissionForm] =
    useState<PermissionForm>(emptyPermissionForm);

  // =========================
  // FETCH EMPLOYEES
  // =========================

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees');

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  };

  // =========================
  // FETCH AGENCIES
  // =========================

  const fetchAgencies = async () => {
    try {
      const response = await api.get('/agencies');

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setAgencies(data);
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
      setAgencies([]);
    }
  };

  // =========================
  // FETCH EMPLOYEE ROLES
  // =========================

  const fetchEmployeeRoles = async () => {
    try {
      const response = await api.get(
        '/admin/employee-roles'
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setEmployeeRoles(data);
    } catch (error) {
      console.error(
        'Failed to fetch employee roles:',
        error
      );

      setEmployeeRoles([]);
    }
  };

  // =========================
  // FETCH PERMISSIONS
  // =========================

  const fetchPermissions = async () => {
    try {
      const response = await api.get(
        '/admin/permissions'
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setPermissions(data);
    } catch (error) {
      console.error(
        'Failed to fetch permissions:',
        error
      );

      setPermissions([]);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchEmployees(),
        fetchAgencies(),
        fetchEmployeeRoles(),
        fetchPermissions(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // FILTER EMPLOYEES
  // =========================

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const search = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        (employee.phone || '')
          .toLowerCase()
          .includes(search);

      const matchesAgency =
        !agencyFilter ||
        employee.agency?.id === agencyFilter;

      const matchesRole =
        !roleFilter ||
        employee.employeeRole?.id === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' &&
          employee.isActive) ||
        (statusFilter === 'inactive' &&
          !employee.isActive);

      return (
        matchesSearch &&
        matchesAgency &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    employees,
    searchQuery,
    agencyFilter,
    roleFilter,
    statusFilter,
  ]);

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.isActive
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => !employee.isActive
  ).length;

  // =========================
  // EMPLOYEE MODAL
  // =========================

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);

    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      agencyId: employee.agency?.id || '',
      employeeRoleId:
        employee.employeeRole?.id || '',
      isActive: employee.isActive,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployee(null);
    setForm(emptyForm);
  };

  // =========================
  // EMPLOYEE FORM
  // =========================

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setForm((previous) => ({
      ...previous,
      isActive: event.target.value === 'true',
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);

    try {
      if (editingEmployee) {
        await api.put(
          `/admin/employees/${editingEmployee.id}`,
          form
        );
      } else {
        await api.post(
          '/admin/employees',
          form
        );
      }

      await fetchEmployees();
      closeModal();
    } catch (error) {
      console.error(
        'Failed to save employee:',
        error
      );

      alert('Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE EMPLOYEE
  // =========================

  const handleDelete = async (
    employee: Employee
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/admin/employees/${employee.id}`
      );

      await fetchEmployees();
    } catch (error) {
      console.error(
        'Failed to delete employee:',
        error
      );

      alert('Failed to delete employee.');
    }
  };

  // =========================
  // ROLE MODAL
  // =========================

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setShowRoleModal(true);
  };

  const openEditRoleModal = (
    role: EmployeeRole
  ) => {
    setEditingRole(role);

    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissionIds:
        role.permissions?.map(
          (permission) => permission.id
        ) || [],
    });

    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    if (savingRole) {
      return;
    }

    setShowRoleModal(false);
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
  };

  // =========================
  // ROLE FORM
  // =========================

  const handleRoleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setRoleForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePermissionChange = (
    permissionId: number
  ) => {
    setRoleForm((previous) => {
      const alreadySelected =
        previous.permissionIds.includes(
          permissionId
        );

      return {
        ...previous,
        permissionIds: alreadySelected
          ? previous.permissionIds.filter(
              (id) => id !== permissionId
            )
          : [
              ...previous.permissionIds,
              permissionId,
            ],
      };
    });
  };

  const handleRoleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSavingRole(true);

    try {
      if (editingRole) {
        await api.put(
          `/admin/employee-roles/${editingRole.id}`,
          roleForm
        );
      } else {
        await api.post(
          '/admin/employee-roles',
          roleForm
        );
      }

      await fetchEmployeeRoles();
      closeRoleModal();
    } catch (error) {
      console.error(
        'Failed to save employee role:',
        error
      );

      alert('Failed to save employee role.');
    } finally {
      setSavingRole(false);
    }
  };

  // =========================
  // DELETE ROLE
  // =========================

  const handleDeleteRole = async (
    role: EmployeeRole
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${role.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/admin/employee-roles/${role.id}`
      );

      await fetchEmployeeRoles();
      await fetchEmployees();
    } catch (error) {
      console.error(
        'Failed to delete employee role:',
        error
      );

      alert('Failed to delete employee role.');
    }
  };

  // =========================
  // PERMISSION MODAL
  // =========================

  const openCreatePermissionModal = () => {
    setPermissionForm(emptyPermissionForm);
    setShowPermissionModal(true);
  };

  const closePermissionModal = () => {
    if (savingPermission) {
      return;
    }

    setShowPermissionModal(false);
    setPermissionForm(emptyPermissionForm);
  };

  // =========================
  // PERMISSION FORM
  // =========================

  const handlePermissionInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setPermissionForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePermissionSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSavingPermission(true);

    try {
      await api.post(
        '/admin/permissions',
        permissionForm
      );

      await fetchPermissions();
      closePermissionModal();
    } catch (error) {
      console.error(
        'Failed to create permission:',
        error
      );

      alert('Failed to create permission.');
    } finally {
      setSavingPermission(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Employees
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your agency employees
          </p>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={openCreateRoleModal}
            className="px-5 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            + Add Role
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm"
          >
            + Add Employee
          </button>

        </div>

      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Employees
          </p>

          <p className="text-3xl font-bold text-gray-900 mt-2">
            {totalEmployees}
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Employees
          </p>

          <p className="text-3xl font-bold text-green-600 mt-2">
            {activeEmployees}
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Inactive Employees
          </p>

          <p className="text-3xl font-bold text-gray-500 mt-2">
            {inactiveEmployees}
          </p>

        </div>

      </div>

      {/* =========================
          EMPLOYEE ROLES
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">

        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">
              Employee Roles
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage the roles available for your employees
            </p>

          </div>

          <button
            type="button"
            onClick={openCreateRoleModal}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
          >
            + Add Role
          </button>

        </div>

        {employeeRoles.length === 0 ? (

          <div className="p-8 text-center text-gray-500">
            No employee roles found.
          </div>

        ) : (

          <div className="divide-y divide-gray-100">

            {employeeRoles.map((role) => (

              <div
                key={role.id}
                className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition"
              >

                <div>

                  <p className="font-medium text-gray-900">
                    {role.name}
                  </p>

                  {role.description ? (

                    <p className="text-sm text-gray-500 mt-1">
                      {role.description}
                    </p>

                  ) : (

                    <p className="text-sm text-gray-400 mt-1">
                      No description
                    </p>

                  )}

                  {role.permissions &&
                    role.permissions.length > 0 && (

                    <div className="flex flex-wrap gap-2 mt-3">

                      {role.permissions.map(
                        (permission) => (

                          <span
                            key={permission.id}
                            className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                          >
                            {permission.name}
                          </span>

                        )
                      )}

                    </div>

                  )}

                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      openEditRoleModal(role)
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteRole(role)
                    }
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =========================
          FILTERS
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Search */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search employee..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
            />

          </div>

          {/* Agency Filter */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Agency
            </label>

            <div className="relative">

              <select
                value={agencyFilter}
                onChange={(event) =>
                  setAgencyFilter(event.target.value)
                }
                className={selectClassName}
              >

                <option value="">
                  All agencies
                </option>

                {agencies.map((agency) => (

                  <option
                    key={agency.id}
                    value={agency.id}
                  >
                    {agency.name}
                  </option>

                ))}

              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>

              </div>

            </div>

          </div>

          {/* Role Filter */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>

            <div className="relative">

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className={selectClassName}
              >

                <option value="">
                  All roles
                </option>

                {employeeRoles.map((role) => (

                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>

                ))}

              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>

              </div>

            </div>

          </div>

          {/* Status Filter */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>

            <div className="relative">

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className={selectClassName}
              >

                <option value="">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =========================
          EMPLOYEE TABLE
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        <div className="px-6 py-5 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            Employee List
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredEmployees.length} employee
            {filteredEmployees.length !== 1
              ? 's'
              : ''}
          </p>

        </div>

        {loading ? (

          <div className="p-10 text-center text-gray-500">
            Loading employees...
          </div>

        ) : filteredEmployees.length === 0 ? (

          <div className="p-10 text-center">

            <p className="text-gray-500">
              No employees found.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              Add Employee
            </button>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Employee
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Contact
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Agency
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Role
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredEmployees.map(
                  (employee) => (

                    <tr
                      key={employee.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700">

                            {employee.firstName
                              .charAt(0)
                              .toUpperCase()}

                            {employee.lastName
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <p className="font-medium text-gray-900">
                              {employee.firstName}{' '}
                              {employee.lastName}
                            </p>

                            <p className="text-xs text-gray-500">
                              Employee
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <p className="text-sm text-gray-900">
                          {employee.email}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {employee.phone || '-'}
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <span className="text-sm text-gray-900">
                          {employee.agency?.name || '-'}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <span className="text-sm text-gray-900">
                          {employee.employeeRole?.name || '-'}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        {employee.isActive ? (

                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Active
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Inactive
                          </span>

                        )}

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                employee
                              )
                            }
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                employee
                              )
                            }
                            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =========================
          ADD / EDIT EMPLOYEE MODAL
      ========================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  {editingEmployee
                    ? 'Edit Employee'
                    : 'Add Employee'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingEmployee
                    ? 'Update employee information'
                    : 'Create a new employee account'}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    placeholder="First name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    placeholder="Last name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                    maxLength={150}
                    placeholder="employee@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    maxLength={50}
                    placeholder="Phone number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                  />

                </div>

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Address"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agency
                  </label>

                  <div className="relative">

                    <select
                      name="agencyId"
                      value={form.agencyId}
                      onChange={handleInputChange}
                      required
                      className={selectClassName}
                    >

                      <option value="">
                        Select an agency
                      </option>

                      {agencies.map(
                        (agency) => (

                          <option
                            key={agency.id}
                            value={agency.id}
                          >
                            {agency.name}
                          </option>

                        )
                      )}

                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 9 6 6 6-6"
                        />
                      </svg>

                    </div>

                  </div>

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee Role
                  </label>

                  <div className="relative">

                    <select
                      name="employeeRoleId"
                      value={
                        form.employeeRoleId
                      }
                      onChange={
                        handleInputChange
                      }
                      required
                      className={
                        selectClassName
                      }
                    >

                      <option value="">
                        Select a role
                      </option>

                      {employeeRoles.map(
                        (role) => (

                          <option
                            key={role.id}
                            value={role.id}
                          >
                            {role.name}
                          </option>

                        )
                      )}

                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 9 6 6 6-6"
                        />
                      </svg>

                    </div>

                  </div>

                </div>

                {editingEmployee && (

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>

                    <div className="relative">

                      <select
                        value={
                          form.isActive
                            ? 'true'
                            : 'false'
                        }
                        onChange={
                          handleStatusChange
                        }
                        className={
                          selectClassName
                        }
                      >

                        <option value="true">
                          Active
                        </option>

                        <option value="false">
                          Inactive
                        </option>

                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">

                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m6 9 6 6 6-6"
                          />
                        </svg>

                      </div>

                    </div>

                  </div>

                )}

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingEmployee
                      ? 'Update Employee'
                      : 'Create Employee'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================
          ADD / EDIT ROLE MODAL
      ========================= */}

      {showRoleModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRole
                    ? 'Edit Employee Role'
                    : 'Add Employee Role'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingRole
                    ? 'Update the role information'
                    : 'Create a new role for your employees'}
                </p>

              </div>

              <button
                type="button"
                onClick={closeRoleModal}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleRoleSubmit}
              className="p-6 space-y-5"
            >

              {/* Role Name */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={roleForm.name}
                  onChange={
                    handleRoleInputChange
                  }
                  required
                  maxLength={100}
                  placeholder="Role name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                />

              </div>

              {/* Description */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    roleForm.description
                  }
                  onChange={
                    handleRoleInputChange
                  }
                  rows={4}
                  placeholder="Describe the responsibilities of this role"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5 resize-none"
                />

              </div>

              {/* Permissions */}

              <div>

                <div className="flex items-center justify-between mb-3">

                  <div>

                    <label className="block text-sm font-semibold text-gray-700">
                      Permissions
                    </label>

                    <p className="text-xs text-gray-500 mt-1">
                      Select the actions allowed for this role
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      openCreatePermissionModal
                    }
                    className="text-sm font-medium text-gray-700 hover:text-black transition"
                  >
                    + Add Permission
                  </button>

                </div>

                <div className="border border-gray-200 rounded-xl max-h-72 overflow-y-auto">

                  {permissions.length === 0 ? (

                    <div className="p-4 text-sm text-gray-500 text-center">
                      No permissions available.
                    </div>

                  ) : (

                    Object.entries(
                      permissions.reduce<
                        Record<
                          string,
                          Permission[]
                        >
                      >(
                        (
                          groups,
                          permission
                        ) => {

                          if (
                            !groups[
                              permission.category
                            ]
                          ) {
                            groups[
                              permission.category
                            ] = [];
                          }

                          groups[
                            permission.category
                          ].push(
                            permission
                          );

                          return groups;

                        },
                        {}
                      )
                    ).map(
                      ([
                        category,
                        categoryPermissions,
                      ]) => (

                        <div
                          key={category}
                          className="border-b border-gray-100 last:border-b-0"
                        >

                          <div className="px-4 py-3 bg-gray-50">

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {category}
                            </p>

                          </div>

                          <div className="p-3 space-y-2">

                            {categoryPermissions.map(
                              (
                                permission
                              ) => {

                                const checked =
                                  roleForm.permissionIds.includes(
                                    permission.id
                                  );

                                return (

                                  <label
                                    key={
                                      permission.id
                                    }
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                  >

                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        handlePermissionChange(
                                          permission.id
                                        )
                                      }
                                      className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                    />

                                    <div>

                                      <p className="text-sm font-medium text-gray-800">
                                        {
                                          permission.name
                                        }
                                      </p>

                                      <p className="text-xs text-gray-400">
                                        {
                                          permission.code
                                        }
                                      </p>

                                    </div>

                                  </label>

                                );
                              }
                            )}

                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

                <p className="text-xs text-gray-500 mt-2">

                  {roleForm.permissionIds.length}{' '}
                  permission
                  {roleForm.permissionIds
                    .length !== 1
                    ? 's'
                    : ''}{' '}
                  selected

                </p>

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={closeRoleModal}
                  disabled={savingRole}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {savingRole
                    ? 'Saving...'
                    : editingRole
                      ? 'Update Role'
                      : 'Create Role'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================
          ADD PERMISSION MODAL
      ========================= */}

      {showPermissionModal && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  Add Permission
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Create a custom permission
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closePermissionModal
                }
                disabled={savingPermission}
                className="text-gray-500 hover:text-gray-900 text-2xl disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handlePermissionSubmit
              }
              className="p-6 space-y-5"
            >

              {/* Name */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Permission Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    permissionForm.name
                  }
                  onChange={
                    handlePermissionInputChange
                  }
                  required
                  maxLength={100}
                  placeholder="View reports"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                />

              </div>

              {/* Code */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Permission Code
                </label>

                <input
                  type="text"
                  name="code"
                  value={
                    permissionForm.code
                  }
                  onChange={
                    handlePermissionInputChange
                  }
                  required
                  maxLength={100}
                  placeholder="report.view"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Use a unique code such as report.view.
                </p>

              </div>

              {/* Category */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={
                    permissionForm.category
                  }
                  onChange={
                    handlePermissionInputChange
                  }
                  required
                  maxLength={50}
                  placeholder="reports"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5"
                />

              </div>

              {/* Description */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    permissionForm.description
                  }
                  onChange={
                    handlePermissionInputChange
                  }
                  rows={3}
                  maxLength={5000}
                  placeholder="Describe what this permission allows"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-black focus:ring-4 focus:ring-black/5 resize-none"
                />

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={
                    closePermissionModal
                  }
                  disabled={savingPermission}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingPermission
                  }
                  className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {savingPermission
                    ? 'Saving...'
                    : 'Create Permission'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default EmployeesPage;