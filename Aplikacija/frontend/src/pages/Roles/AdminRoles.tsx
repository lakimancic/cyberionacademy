import { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/Table/DataTable";
import "./AdminRoles.css";
import { Avatar, MenuItem, Select } from "@mui/material";
import SearchBar from "@/components/SearchBar/SearchBar";
import AuthImage from "@/components/AuthImage/AuthImage";
import { Link } from "react-router-dom";
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { IoMdArrowRoundBack } from "react-icons/io";

type RoleRequest = {
  id: number;
  requestedAt: string;
  username: string;
  role: string;
  userId: number;
  text: string;
  status: string;
};

type UserData = {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
};

const roles = ["User", "Helper", "Moderator", "Admin"];

function AdminRoles() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchWord, setSearchWord] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleRequest, setRoleRequest] = useState<RoleRequest | null>(null);
  const [sortKey, setSortKey] = useState<keyof UserData>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [tab, setTab] = useState(0);

  const fetchUsers = async (search?: string) => {
    await api
      .get("/Roles/UserList", {
        params: {
          page: currentPage,
          search: search,
          role: roleFilter,
          sortKey: sortKey,
          sortDir: sortDir,
        },
      })
      .then((resp) => {
        setTotalPages(resp.data.totalPages);
        setUsers(resp.data.users);
      })
      .catch(() => {});
  };

  const fetchRoleRequests = async (isPending: boolean) => {
    await api
      .get("/Roles/RoleRequests", {
        params: { page: currentPage, pending: isPending },
      })
      .then((resp) => {
        setTotalPages(resp.data.totalPages);
        setRequests(resp.data.requests);
      })
      .catch(() => {});
  };

  const changeTab = async (newTab: number) => {
    if (newTab === tab) return;

    setTab(newTab);
    setRoleRequest(null);
    setCurrentPage(1);
    setTotalPages(1);

    if (newTab > 1) {
      setUsers([]);
      await fetchUsers();
    } else {
      setRequests([]);
      await fetchRoleRequests(newTab === 0);
    }
  };

  const handleRoleChange = (userInd: number, newRole: string) => {
    setUsers((prev) =>
      prev.map((user, ind) =>
        ind === userInd ? { ...user, role: newRole } : user
      )
    );
  };

  const submitRoleChange = (userInd: number) => {
    const user = users[userInd];
    api
      .put("/Roles/ChangeUserRole", { newRole: user.role, userId: user.userId })
      .then(() => {
        fetchUsers();
      })
      .catch(() => {});
  };

  const onSearch = () => {
    setCurrentPage(1);
    setTotalPages(1);

    fetchUsers(searchWord);
  };

  const acceptReject = (accept: boolean) => {
    setRoleRequest(null);

    api
      .put("/Roles/AcceptRejectRole", {
        accept: accept,
        requestId: roleRequest?.id,
      })
      .then(() => {
        setCurrentPage(1);
        setTotalPages(1);
        fetchRoleRequests(true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (tab > 1) {
      fetchUsers();
    } else {
      fetchRoleRequests(tab === 0);
    }
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    fetchUsers();
  }, [roleFilter, sortDir, sortKey]);

  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTab(0);
    fetchRoleRequests(true);
  }, []);

  return (
    <div className="admin-roles">
      <h2>Admin Panel - Users' Roles</h2>
      <div className="admin-tabs">
        <div className="admin-tab" onClick={() => changeTab(0)}>
          Pending Requests
        </div>
        <div className="admin-tab" onClick={() => changeTab(1)}>
          Old Requests
        </div>
        <div className="admin-tab" onClick={() => changeTab(2)}>
          User List
        </div>
        <div
          className="admin-tab-active"
          style={{ left: `${6.25 + 31.25 * tab}%` }}
        ></div>
      </div>
      <div className="admin-content">
        {tab < 2 && roleRequest === null && (
          <DataTable
            data={requests.map((req) => {
              return {
                username: req.username,
                requestedAt: new Date(req.requestedAt).toLocaleDateString(),
                role: (
                  <strong className={`role-${req.role.toLocaleLowerCase()}`}>
                    {req.role}
                  </strong>
                ),
                status: req.status,
              };
            })}
            columns={[
              { key: "username", header: "Requested by" },
              { key: "requestedAt", header: "Requested at" },
              { key: "role", header: "Role" },
              { key: "status", header: "Status" },
            ]}
            pagination={{
              page: currentPage,
              totalPages: totalPages,
              setPage: setCurrentPage,
            }}
            onRowClick={(_, ind) => setRoleRequest(requests[ind])}
          />
        )}
        {tab < 2 && roleRequest !== null && (
          <div className="admin-role-request">
            <IoMdArrowRoundBack
              className="admin-back"
              onClick={() => setRoleRequest(null)}
            />
            <div className="admin-req-left">
              <div className="admin-req-user">
                <Link to={`/user/${roleRequest.userId}`}>
                  <AuthImage
                    src={`/User/${roleRequest.userId}/ProfilePicture`}
                    element={Avatar}
                    className="admin-req-avatar"
                  />
                </Link>
                <div className="admin-req-user-info">
                  <div className="admin-req-username">
                    {roleRequest.username}
                  </div>
                  <div className="admin-req-role">
                    Requsted Role:{" "}
                    <span
                      className={`role-${roleRequest.role.toLocaleLowerCase()}`}
                    >
                      {roleRequest.role}
                    </span>
                  </div>
                  <div className="admin-req-date">
                    Requested at:{" "}
                    <strong>
                      {new Date(roleRequest.requestedAt).toLocaleDateString()}
                    </strong>
                  </div>
                </div>
              </div>
              {tab === 0 && (
                <div className="admin-req-buttons">
                  <button
                    className="admin-req-accept"
                    onClick={() => acceptReject(true)}
                  >
                    Accept <FaCheck />
                  </button>
                  <button
                    className="admin-req-reject"
                    onClick={() => acceptReject(false)}
                  >
                    Reject <FaXmark />
                  </button>
                </div>
              )}
            </div>
            <div className="admin-req-right">
              <div className="admin-req-label">Request letter:</div>
              <div className="admin-req-text">{roleRequest.text}</div>
            </div>
          </div>
        )}
        {tab == 2 && (
          <div className="admin-users-con">
            <div className="admin-filters">
              <SearchBar
                label="Users"
                setSearchWord={setSearchWord}
                searchWord={searchWord}
                onSearch={onSearch}
              />
              <div className="admin-filter-role">
                <Select
                  value={roleFilter}
                  displayEmpty
                  onChange={(e) => setRoleFilter(e.target.value)}
                  renderValue={(selected) => {
                    if (selected.length === 0)
                      return (
                        <span className="admin-placeholder">
                          Filter by Role
                        </span>
                      );

                    return selected;
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((role, idx) => (
                    <MenuItem key={idx} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
            <DataTable
              data={users.map((user, ind) => {
                return {
                  ...user,
                  role: (
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(ind, e.target.value)}
                      className="admin-select"
                    >
                      {roles.map((role, idx) => (
                        <MenuItem key={idx} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  ),
                  action: (
                    <button onClick={() => submitRoleChange(ind)}>
                      Change Role
                    </button>
                  ),
                };
              })}
              columns={[
                { key: "username", header: "Username", sortable: true },
                { key: "email", header: "Email", sortable: true },
                { key: "fullName", header: "Full Name", sortable: true },
                { key: "role", header: "Role" },
                { key: "action", header: "Action" },
              ]}
              pagination={{
                page: currentPage,
                totalPages: totalPages,
                setPage: setCurrentPage,
              }}
              sort={{
                key: sortKey,
                dir: sortDir,
                onSetSortDir: setSortDir,
                onSetSortKey: (arg) => setSortKey(arg as keyof UserData),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRoles;
