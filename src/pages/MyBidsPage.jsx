import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

const MyBidsPage = () => {
    const { user } = useAuth();

    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMyBids = async () => {
            if (!user?.uid) {
                setBids([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const bidsQuery = query(
                    collection(db, "auctionBids"),
                    where("bidderUserId", "==", user.uid)
                );

                const snapshot = await getDocs(bidsQuery);

                const fetchedBids = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                fetchedBids.sort((a, b) => {
                    const dateA = a.createdAt?.toDate
                        ? a.createdAt.toDate()
                        : new Date(0);

                    const dateB = b.createdAt?.toDate
                        ? b.createdAt.toDate()
                        : new Date(0);

                    return dateB - dateA;
                });

                setBids(fetchedBids);
            } catch (err) {
                console.error("Error fetching my bids:", err);
                setError(
                    err.message || "Failed to load your bid history."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMyBids();
    }, [user?.uid]);

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "—";
        }

        try {
            const date = timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);

            if (Number.isNaN(date.getTime())) {
                return "—";
            }

            return date.toLocaleString();
        } catch {
            return "—";
        }
    };

    const getStatusClass = (status) => {
        switch ((status || "").toLowerCase()) {
            case "accepted":
                return "accepted";

            case "rejected":
                return "rejected";

            case "pending":
            default:
                return "pending";
        }
    };

    const getStatusLabel = (status) => {
        if (!status) {
            return "Pending";
        }

        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div>
            <h2>My Bids</h2>

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >
                <p>My bids for:</p>

                <strong>{user?.email || "Not signed in"}</strong>

                {loading && (
                    <p
                        style={{
                            marginTop: "1rem",
                            color: "#6b7280",
                        }}
                    >
                        Loading your bids...
                    </p>
                )}

                {!loading && error && (
                    <div
                        style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading && !error && bids.length === 0 && (
                    <p
                        style={{
                            marginTop: "1rem",
                            color: "#6b7280",
                        }}
                    >
                        You have not placed any bids yet.
                    </p>
                )}

                {!loading && !error && bids.length > 0 && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            display: "grid",
                            gap: "1rem",
                        }}
                    >
                        {bids.map((bid) => (
                            <div
                                key={bid.id}
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    padding: "1rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                }}
                            >
                                {bid.equipmentImage && (
                                    <img
                                        src={bid.equipmentImage}
                                        alt={bid.equipmentName || "Equipment"}
                                        style={{
                                            width: "110px",
                                            height: "80px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            flexShrink: 0,
                                        }}
                                    />
                                )}

                                <div
                                    style={{
                                        flex: 1,
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: "0 0 0.5rem",
                                        }}
                                    >
                                        {bid.equipmentName || "Equipment"}
                                    </h3>

                                    <p
                                        style={{
                                            margin: "0.25rem 0",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Seller:{" "}
                                        <strong
                                            style={{
                                                color: "#374151",
                                            }}
                                        >
                                            {bid.sellerCompany || "—"}
                                        </strong>
                                    </p>

                                    <p
                                        style={{
                                            margin: "0.25rem 0",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Bid Amount:{" "}
                                        <strong
                                            style={{
                                                color: "#111827",
                                            }}
                                        >
                                            {bid.bidAmount ?? "—"}
                                        </strong>
                                    </p>

                                    <p
                                        style={{
                                            margin: "0.25rem 0",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Submitted:{" "}
                                        {formatDate(bid.createdAt)}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        alignSelf: "flex-start",
                                    }}
                                >
                                    <span
                                        className={`bid-status ${getStatusClass(
                                            bid.status
                                        )}`}
                                        style={{
                                            display: "inline-block",
                                            padding: "0.35rem 0.7rem",
                                            borderRadius: "999px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            background:
                                                getStatusClass(bid.status) ===
                                                "accepted"
                                                    ? "#dcfce7"
                                                    : getStatusClass(
                                                        bid.status
                                                    ) === "rejected"
                                                        ? "#fee2e2"
                                                        : "#fef3c7",
                                            color:
                                                getStatusClass(bid.status) ===
                                                "accepted"
                                                    ? "#166534"
                                                    : getStatusClass(
                                                        bid.status
                                                    ) === "rejected"
                                                        ? "#991b1b"
                                                        : "#92400e",
                                        }}
                                    >
                                        {getStatusLabel(bid.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBidsPage;