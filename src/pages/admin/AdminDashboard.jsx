import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
    Newspaper,
    Gavel,
    Tractor,
    FolderKanban,
    Users,
    HandCoins,
} from "lucide-react";
import { db } from "../../lib/firebase";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        news: 0,
        tenders: 0,
        equipment: 0,
        projects: 0,
        users: 0,
        bids: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    newsSnap,
                    tendersSnap,
                    equipmentSnap,
                    projectsSnap,
                    usersSnap,
                    bidsSnap,
                ] = await Promise.all([
                    getDocs(collection(db, "news")),
                    getDocs(collection(db, "tenders")),
                    getDocs(collection(db, "equipmentListings")),
                    getDocs(collection(db, "projects")),
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "auctionBids")),
                ]);

                setStats({
                    news: newsSnap.size,
                    tenders: tendersSnap.size,
                    equipment: equipmentSnap.size,
                    projects: projectsSnap.size,
                    users: usersSnap.size,
                    bids: bidsSnap.size,
                });
            } catch (err) {
                console.error(
                    "Error fetching admin statistics:",
                    err
                );

                setError(
                    "Unable to load dashboard statistics. Please check your Firestore permissions."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                }}
            >
                Loading dashboard...
            </div>
        );
    }

    return (
        <div>
            <div
                style={{
                    marginBottom: "1.5rem",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: "1.5rem",
                    }}
                >
                    Dashboard Overview
                </h2>

                <p
                    style={{
                        marginTop: "0.35rem",
                        color: "#6b7280",
                    }}
                >
                    Overview of your GVICE platform data.
                </p>
            </div>

            {error && (
                <div
                    className="admin-card"
                    style={{
                        marginBottom: "1.5rem",
                        color: "#b91c1c",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {/* News */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(59, 130, 246, 0.1)",
                            color: "#3b82f6",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <Newspaper size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Total News
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.news}
                        </h3>
                    </div>
                </div>

                {/* Tenders */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <Gavel size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Total Tenders
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.tenders}
                        </h3>
                    </div>
                </div>

                {/* Equipment */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(16, 185, 129, 0.1)",
                            color: "#10b981",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <Tractor size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Equipment Listed
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.equipment}
                        </h3>
                    </div>
                </div>

                {/* Projects */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(245, 158, 11, 0.1)",
                            color: "#f59e0b",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <FolderKanban size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Total Projects
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.projects}
                        </h3>
                    </div>
                </div>

                {/* Users */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(139, 92, 246, 0.1)",
                            color: "#8b5cf6",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <Users size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Registered Users
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.users}
                        </h3>
                    </div>
                </div>

                {/* Bids */}
                <div
                    className="admin-card"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor:
                                "rgba(20, 184, 166, 0.1)",
                            color: "#0f766e",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <HandCoins size={30} />
                    </div>

                    <div>
                        <p
                            style={{
                                color: "#6b7280",
                                margin: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            Auction Bids
                        </p>

                        <h3
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "1.875rem",
                            }}
                        >
                            {stats.bids}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;