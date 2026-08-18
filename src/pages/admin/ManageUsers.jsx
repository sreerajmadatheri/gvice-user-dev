import { useEffect, useMemo, useState } from "react";

import {
    Search,
    Edit3,
    Save,
    X,
    ShieldCheck,
    ShieldOff,
    User,
    RefreshCw,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import {
    httpsCallable,
} from "firebase/functions";

import { db, functions } from "../../lib/firebase";

import {
    updateUserProfile,
} from "../../services/userService";

import { useAuth } from "../../context/AuthContext";


const ManageUsers = () => {

    const {
        user: currentUser,
    } = useAuth();


    const [users, setUsers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");


    const [editingUser, setEditingUser] =
        useState(null);

    const [formData, setFormData] =
        useState({});


    const [saving, setSaving] =
        useState(false);

    const [changingRole, setChangingRole] =
        useState(false);


    const [status, setStatus] =
        useState({
            type: "",
            message: "",
        });


    // =====================================================
    // LOAD USERS
    // =====================================================

    const loadUsers = async (
        showRefreshState = false
    ) => {

        if (showRefreshState) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }


        try {

            const snapshot =
                await getDocs(
                    collection(db, "users")
                );


            const loadedUsers =
                snapshot.docs.map(
                    (userDoc) => ({
                        id: userDoc.id,
                        ...userDoc.data(),
                    })
                );


            loadedUsers.sort(
                (a, b) => {

                    const nameA =
                        (
                            a.displayName ||
                            a.email ||
                            ""
                        ).toLowerCase();

                    const nameB =
                        (
                            b.displayName ||
                            b.email ||
                            ""
                        ).toLowerCase();

                    return nameA.localeCompare(nameB);
                }
            );


            setUsers(loadedUsers);

        } catch (error) {

            console.error(
                "Error loading users:",
                error
            );

            setStatus({
                type: "error",
                message:
                    "Unable to load users. Please try again.",
            });

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        loadUsers();
    }, []);


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredUsers =
        useMemo(() => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!search) {
                return users;
            }


            return users.filter(
                (item) => {

                    const values = [
                        item.displayName,
                        item.firstName,
                        item.lastName,
                        item.email,
                        item.company,
                        item.designation,
                        item.phone,
                        item.country,
                        item.city,
                        item.role,
                    ];


                    return values.some(
                        (value) =>
                            String(value || "")
                                .toLowerCase()
                                .includes(search)
                    );
                }
            );

        }, [
            users,
            searchTerm,
        ]);


    // =====================================================
    // EDIT USER
    // =====================================================

    const handleEditUser = (item) => {

        setStatus({
            type: "",
            message: "",
        });


        setEditingUser(item);

        setFormData({
            displayName:
                item.displayName || "",

            firstName:
                item.firstName || "",

            lastName:
                item.lastName || "",

            company:
                item.company || "",

            designation:
                item.designation || "",

            phone:
                item.phone || "",

            country:
                item.country || "",

            city:
                item.city || "",
        });
    };


    // =====================================================
    // CLOSE EDIT
    // =====================================================

    const handleCloseEdit = () => {

        if (saving || changingRole) {
            return;
        }

        setEditingUser(null);
        setFormData({});
    };


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };


    // =====================================================
    // SAVE USER PROFILE
    // =====================================================

    const handleSaveUser = async () => {

        if (!editingUser?.id) {
            return;
        }


        setSaving(true);

        setStatus({
            type: "",
            message: "",
        });


        try {

            const updates = {

                displayName:
                    formData.displayName.trim(),

                firstName:
                    formData.firstName.trim(),

                lastName:
                    formData.lastName.trim(),

                company:
                    formData.company.trim(),

                designation:
                    formData.designation.trim(),

                phone:
                    formData.phone.trim(),

                country:
                    formData.country.trim(),

                city:
                    formData.city.trim(),
            };


            await updateUserProfile(
                editingUser.id,
                updates
            );


            setUsers(
                (previous) =>
                    previous.map(
                        (item) =>
                            item.id === editingUser.id
                                ? {
                                    ...item,
                                    ...updates,
                                }
                                : item
                    )
            );


            setEditingUser(
                (previous) =>
                    previous
                        ? {
                            ...previous,
                            ...updates,
                        }
                        : previous
            );


            setStatus({
                type: "success",
                message:
                    "User profile updated successfully.",
            });

        } catch (error) {

            console.error(
                "Error updating user:",
                error
            );

            setStatus({
                type: "error",
                message:
                    error?.message ||
                    "Unable to update user profile.",
            });

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // CHANGE ADMIN STATUS
    // =====================================================

    const handleChangeAdminStatus =
        async (targetUser) => {

            if (!targetUser?.id) {
                return;
            }


            // Do not allow an admin to remove
            // their own admin access.
            if (
                targetUser.id ===
                currentUser?.uid
            ) {

                setStatus({
                    type: "error",
                    message:
                        "You cannot change your own admin status.",
                });

                return;
            }


            const currentlyAdmin =
                targetUser.role === "admin";


            const action =
                currentlyAdmin
                    ? "remove"
                    : "promote";


            const confirmation =
                currentlyAdmin
                    ? `Remove admin access from ${
                        targetUser.displayName ||
                        targetUser.email ||
                        "this user"
                    }?`
                    : `Make ${
                        targetUser.displayName ||
                        targetUser.email ||
                        "this user"
                    } an administrator?`;


            if (!window.confirm(confirmation)) {
                return;
            }


            setChangingRole(true);

            setStatus({
                type: "",
                message: "",
            });


            try {

                const setUserAdmin =
                    httpsCallable(
                        functions,
                        "setUserAdmin"
                    );


                const result =
                    await setUserAdmin({
                        targetUserId:
                        targetUser.id,

                        makeAdmin:
                            action === "promote",
                    });


                const response =
                    result?.data;


                if (!response?.success) {

                    throw new Error(
                        response?.message ||
                        "Unable to change admin status."
                    );
                }


                const newRole =
                    action === "promote"
                        ? "admin"
                        : "user";


                setUsers(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.id === targetUser.id
                                    ? {
                                        ...item,
                                        role: newRole,
                                    }
                                    : item
                        )
                );


                if (
                    editingUser?.id ===
                    targetUser.id
                ) {

                    setEditingUser(
                        (previous) =>
                            previous
                                ? {
                                    ...previous,
                                    role: newRole,
                                }
                                : previous
                    );
                }


                setStatus({
                    type: "success",
                    message:
                        action === "promote"
                            ? "User has been promoted to Admin."
                            : "Admin access has been removed from the user.",
                });

            } catch (error) {

                console.error(
                    "Error changing admin status:",
                    error
                );


                setStatus({
                    type: "error",
                    message:
                        error?.message ||
                        "Unable to change admin status.",
                });

            } finally {

                setChangingRole(false);
            }
        };


    // =====================================================
    // FORM FIELD
    // =====================================================

    const renderField = (
        label,
        name,
        value,
        placeholder
    ) => {

        return (
            <div className="admin-form-group">

                <label htmlFor={name}>
                    {label}
                </label>

                <input
                    id={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                />

            </div>
        );
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div>

                <div className="admin-page-header">

                    <h2>
                        Manage Users
                    </h2>

                </div>

                <div className="admin-card">

                    Loading users...

                </div>

            </div>
        );
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div>

            {/* Header */}

            <div className="admin-page-header">

                <div>

                    <h2>
                        Manage Users
                    </h2>

                    <p
                        style={{
                            marginTop: "0.4rem",
                            color: "#6b7280",
                        }}
                    >
                        Manage registered users and
                        administrator access.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-btn"
                    onClick={() =>
                        loadUsers(true)
                    }
                    disabled={refreshing}
                >

                    <RefreshCw
                        size={17}
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}

                </button>

            </div>


            {/* Status */}

            {status.message && (

                <div
                    style={{
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color:
                            status.type === "success"
                                ? "#15803d"
                                : "#dc2626",
                    }}
                >

                    {status.type === "success" ? (
                        <CheckCircle size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}

                    <span>
            {status.message}
          </span>

                </div>
            )}


            {/* Search */}

            <div className="admin-card">

                <div
                    style={{
                        position: "relative",
                        maxWidth: "600px",
                    }}
                >

                    <Search
                        size={19}
                        style={{
                            position: "absolute",
                            left: "0.75rem",
                            top: "50%",
                            transform:
                                "translateY(-50%)",
                            color: "#6b7280",
                        }}
                    />

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        placeholder="Search users by name, email, company, role..."
                        style={{
                            width: "100%",
                            padding:
                                "0.7rem 0.75rem 0.7rem 2.5rem",
                            border:
                                "1px solid #d1d5db",
                            borderRadius: "0.375rem",
                            boxSizing: "border-box",
                        }}
                    />

                </div>

            </div>


            {/* Users */}

            <div className="admin-card">

                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                        <tr>

                            <th>
                                User
                            </th>

                            <th>
                                Company
                            </th>

                            <th>
                                Role
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Actions
                            </th>

                        </tr>

                        </thead>


                        <tbody>

                        {filteredUsers.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="5"
                                    style={{
                                        textAlign: "center",
                                        padding: "2rem",
                                        color: "#6b7280",
                                    }}
                                >
                                    No users found.
                                </td>

                            </tr>

                        ) : (

                            filteredUsers.map(
                                (item) => {

                                    const isCurrentUser =
                                        item.id ===
                                        currentUser?.uid;

                                    const isAdmin =
                                        item.role ===
                                        "admin";


                                    return (
                                        <tr
                                            key={item.id}
                                        >

                                            <td>

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "0.75rem",
                                                    }}
                                                >

                                                    <User
                                                        size={18}
                                                        color="#6b7280"
                                                    />

                                                    <div>

                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    600,
                                                            }}
                                                        >
                                                            {item.displayName ||
                                                                `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                                                                "Unnamed User"}
                                                        </div>

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.85rem",
                                                                color:
                                                                    "#6b7280",
                                                            }}
                                                        >
                                                            {item.email ||
                                                                "-"}
                                                        </div>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>
                                                {item.company ||
                                                    "-"}
                                            </td>


                                            <td>

                                                {isAdmin ? (

                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            gap:
                                                                "0.35rem",
                                                            color:
                                                                "#15803d",
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                              <ShieldCheck
                                  size={17}
                              />
                              Admin
                            </span>

                                                ) : (

                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            gap:
                                                                "0.35rem",
                                                            color:
                                                                "#6b7280",
                                                        }}
                                                    >
                              <User
                                  size={17}
                              />
                              User
                            </span>

                                                )}

                                            </td>


                                            <td>

                                                {item.isApproved === false
                                                    ? "Not Approved"
                                                    : "Approved"}

                                            </td>


                                            <td>

                                                <div className="action-btns">

                                                    <button
                                                        type="button"
                                                        className="admin-btn admin-btn-secondary"
                                                        onClick={() =>
                                                            handleEditUser(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        <Edit3
                                                            size={16}
                                                        />
                                                        Edit
                                                    </button>


                                                    {!isCurrentUser && (

                                                        <button
                                                            type="button"
                                                            className="admin-btn"
                                                            onClick={() =>
                                                                handleChangeAdminStatus(
                                                                    item
                                                                )
                                                            }
                                                            disabled={
                                                                changingRole
                                                            }
                                                        >

                                                            {isAdmin ? (
                                                                <>
                                                                    <ShieldOff
                                                                        size={16}
                                                                    />
                                                                    Remove Admin
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldCheck
                                                                        size={16}
                                                                    />
                                                                    Make Admin
                                                                </>
                                                            )}

                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                }
                            )

                        )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* Edit Modal */}

            {editingUser && (

                <div className="admin-modal-overlay">

                    <div className="admin-modal">

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                marginBottom: "1.5rem",
                            }}
                        >

                            <div>

                                <h3
                                    style={{
                                        marginBottom:
                                            "0.25rem",
                                    }}
                                >
                                    Edit User
                                </h3>

                                <p
                                    style={{
                                        margin: 0,
                                        color: "#6b7280",
                                        fontSize:
                                            "0.9rem",
                                    }}
                                >
                                    {editingUser.email}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="icon-action-btn"
                                onClick={
                                    handleCloseEdit
                                }
                                disabled={
                                    saving ||
                                    changingRole
                                }
                            >
                                <X size={22} />
                            </button>

                        </div>


                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "1rem",
                            }}
                        >

                            {renderField(
                                "Display Name",
                                "displayName",
                                formData.displayName,
                                "Display name"
                            )}

                            {renderField(
                                "First Name",
                                "firstName",
                                formData.firstName,
                                "First name"
                            )}

                            {renderField(
                                "Last Name",
                                "lastName",
                                formData.lastName,
                                "Last name"
                            )}

                            {renderField(
                                "Company",
                                "company",
                                formData.company,
                                "Company"
                            )}

                            {renderField(
                                "Designation",
                                "designation",
                                formData.designation,
                                "Designation"
                            )}

                            {renderField(
                                "Phone",
                                "phone",
                                formData.phone,
                                "Phone"
                            )}

                            {renderField(
                                "Country",
                                "country",
                                formData.country,
                                "Country"
                            )}

                            {renderField(
                                "City",
                                "city",
                                formData.city,
                                "City"
                            )}

                        </div>


                        {/* Read-only information */}

                        <div
                            style={{
                                marginTop: "1rem",
                                paddingTop: "1rem",
                                borderTop:
                                    "1px solid #e5e7eb",
                            }}
                        >

                            <p>
                                <strong>
                                    Email:
                                </strong>{" "}
                                {editingUser.email ||
                                    "-"}
                            </p>


                            <p>
                                <strong>
                                    Firebase UID:
                                </strong>{" "}
                                {editingUser.id}
                            </p>


                            <p>
                                <strong>
                                    Current Role:
                                </strong>{" "}
                                {editingUser.role ||
                                    "user"}
                            </p>

                        </div>


                        {/* Admin actions */}

                        <div
                            style={{
                                marginTop: "1rem",
                                padding:
                                    "1rem",
                                background:
                                    "#f9fafb",
                                borderRadius:
                                    "0.375rem",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap: "1rem",
                                    flexWrap:
                                        "wrap",
                                }}
                            >

                                <div>

                                    <strong>
                                        Administrator Access
                                    </strong>

                                    <p
                                        style={{
                                            margin:
                                                "0.35rem 0 0",
                                            color:
                                                "#6b7280",
                                            fontSize:
                                                "0.85rem",
                                        }}
                                    >
                                        {editingUser.role ===
                                        "admin"
                                            ? "This user has administrator access."
                                            : "This user is a normal user."}
                                    </p>

                                </div>


                                {editingUser.id !==
                                    currentUser?.uid && (

                                        <button
                                            type="button"
                                            className="admin-btn"
                                            onClick={() =>
                                                handleChangeAdminStatus(
                                                    editingUser
                                                )
                                            }
                                            disabled={
                                                changingRole
                                            }
                                        >

                                            {editingUser.role ===
                                            "admin" ? (
                                                <>
                                                    <ShieldOff
                                                        size={17}
                                                    />
                                                    {changingRole
                                                        ? "Removing..."
                                                        : "Remove Admin"}
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck
                                                        size={17}
                                                    />
                                                    {changingRole
                                                        ? "Promoting..."
                                                        : "Make Admin"}
                                                </>
                                            )}

                                        </button>

                                    )}

                            </div>

                        </div>


                        {/* Actions */}

                        <div className="admin-form-actions">

                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={
                                    handleCloseEdit
                                }
                                disabled={
                                    saving ||
                                    changingRole
                                }
                            >

                                <X size={17} />

                                Cancel

                            </button>


                            <button
                                type="button"
                                className="admin-btn"
                                onClick={
                                    handleSaveUser
                                }
                                disabled={
                                    saving ||
                                    changingRole
                                }
                            >

                                <Save size={17} />

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};


export default ManageUsers;