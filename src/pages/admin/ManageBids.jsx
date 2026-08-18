import { useEffect, useMemo, useState } from "react";

import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";

import {
    Gavel,
    CheckCircle,
    XCircle,
    Trash2,
    RefreshCw,
    Search,
} from "lucide-react";

import { db } from "../../lib/firebase";
import "./Admin.css";


const ManageBids = () => {

    const [bids, setBids] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [actionId, setActionId] =
        useState(null);

    const [error, setError] =
        useState("");


    // =====================================================
    // SEARCH / FILTER
    // =====================================================

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");


    // =====================================================
    // FETCH BIDS
    // =====================================================

    const fetchBids = async () => {

        setLoading(true);
        setError("");

        try {

            /*
             * Do not use orderBy("createdAt") here.
             *
             * Some older bids may not contain createdAt.
             * Fetch everything and sort locally instead.
             */

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "auctionBids"
                    )
                );


            const data =
                snapshot.docs.map(
                    (bidDoc) => ({
                        ...bidDoc.data(),
                        id: bidDoc.id,
                    })
                );


            // ---------------------------------------------
            // NEWEST FIRST
            // ---------------------------------------------

            data.sort(
                (a, b) => {

                    const getTime =
                        (timestamp) => {

                            if (
                                !timestamp
                            ) {
                                return 0;
                            }


                            try {

                                if (
                                    typeof timestamp.toDate ===
                                    "function"
                                ) {

                                    return timestamp
                                        .toDate()
                                        .getTime();

                                }


                                if (
                                    timestamp.seconds
                                ) {

                                    return (
                                        Number(
                                            timestamp.seconds
                                        ) *
                                        1000
                                    );

                                }


                                return new Date(
                                    timestamp
                                ).getTime();

                            } catch {

                                return 0;

                            }

                        };


                    return (
                        getTime(
                            b.createdAt
                        ) -
                        getTime(
                            a.createdAt
                        )
                    );

                }
            );


            setBids(data);

        } catch (err) {

            console.error(
                "Error loading bids:",
                err
            );


            setError(
                "Unable to load bids. Please check Firestore permissions."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchBids();

    }, []);


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        timestamp
    ) => {

        if (!timestamp) {

            return "—";

        }


        try {

            if (
                typeof timestamp.toDate ===
                "function"
            ) {

                return timestamp
                    .toDate()
                    .toLocaleString();

            }


            if (
                timestamp.seconds
            ) {

                return new Date(
                    Number(
                        timestamp.seconds
                    ) * 1000
                ).toLocaleString();

            }


            return new Date(
                timestamp
            ).toLocaleString();

        } catch {

            return "—";

        }

    };


    // =====================================================
    // FORMAT AMOUNT
    // =====================================================

    const formatAmount = (
        amount
    ) => {

        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return "—";

        }


        const numericAmount =
            Number(amount);


        if (
            Number.isNaN(
                numericAmount
            )
        ) {

            return amount;

        }


        return numericAmount.toLocaleString();

    };


    // =====================================================
    // FILTERED BIDS
    // =====================================================

    const filteredBids =
        useMemo(() => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            return bids.filter(
                (bid) => {

                    // -------------------------------------
                    // STATUS FILTER
                    // -------------------------------------

                    const normalizedStatus =
                        String(
                            bid.status ||
                            "Pending"
                        ).toLowerCase();


                    const matchesStatus =
                        statusFilter ===
                        "All" ||
                        normalizedStatus ===
                        statusFilter.toLowerCase();


                    if (
                        !matchesStatus
                    ) {

                        return false;

                    }


                    // -------------------------------------
                    // SEARCH
                    // -------------------------------------

                    if (!search) {

                        return true;

                    }


                    const searchableText = [

                        bid.equipmentName,

                        bid.bidderName,

                        bid.bidderEmail,

                        bid.sellerName,

                        bid.sellerEmail,

                        bid.sellerCompany,

                        bid.sector,

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        search
                    );

                }
            );

        }, [
            bids,
            searchTerm,
            statusFilter,
        ]);


    // =====================================================
    // STATUS COUNTS
    // =====================================================

    const statusCounts =
        useMemo(() => {

            const counts = {
                all: bids.length,
                pending: 0,
                accepted: 0,
                rejected: 0,
            };


            bids.forEach(
                (bid) => {

                    const status =
                        String(
                            bid.status ||
                            "Pending"
                        ).toLowerCase();


                    if (
                        status ===
                        "accepted"
                    ) {

                        counts.accepted++;

                    } else if (
                        status ===
                        "rejected"
                    ) {

                        counts.rejected++;

                    } else {

                        counts.pending++;

                    }

                }
            );


            return counts;

        }, [bids]);


    // =====================================================
    // UPDATE BID STATUS
    // =====================================================

    const updateBidStatus = async (
        bidId,
        status
    ) => {

        const message =
            status === "Accepted"
                ? "Accept this bid?"
                : "Reject this bid?";


        if (
            !window.confirm(
                message
            )
        ) {

            return;

        }


        setActionId(
            bidId
        );

        setError("");


        try {

            await updateDoc(
                doc(
                    db,
                    "auctionBids",
                    bidId
                ),
                {
                    status,

                    updatedAt:
                        serverTimestamp(),
                }
            );


            setBids(
                (previous) =>
                    previous.map(
                        (bid) =>
                            bid.id ===
                            bidId
                                ? {
                                    ...bid,
                                    status,
                                }
                                : bid
                    )
            );

        } catch (err) {

            console.error(
                "Error updating bid:",
                err
            );


            setError(
                "Unable to update this bid. Please check your Firestore permissions."
            );

        } finally {

            setActionId(
                null
            );

        }

    };


    // =====================================================
    // DELETE BID
    // =====================================================

    const deleteBid = async (
        bidId
    ) => {

        if (
            !window.confirm(
                "Delete this bid permanently?"
            )
        ) {

            return;

        }


        setActionId(
            bidId
        );

        setError("");


        try {

            await deleteDoc(
                doc(
                    db,
                    "auctionBids",
                    bidId
                )
            );


            setBids(
                (previous) =>
                    previous.filter(
                        (bid) =>
                            bid.id !==
                            bidId
                    )
            );

        } catch (err) {

            console.error(
                "Error deleting bid:",
                err
            );


            setError(
                "Unable to delete this bid. Please check your Firestore permissions."
            );

        } finally {

            setActionId(
                null
            );

        }

    };


    // =====================================================
    // STATUS STYLE
    // =====================================================

    const getStatusStyle = (
        status
    ) => {

        const normalized =
            String(
                status ||
                "Pending"
            ).toLowerCase();


        if (
            normalized ===
            "accepted"
        ) {

            return {
                backgroundColor:
                    "#dcfce7",

                color:
                    "#166534",
            };

        }


        if (
            normalized ===
            "rejected"
        ) {

            return {
                backgroundColor:
                    "#fee2e2",

                color:
                    "#991b1b",
            };

        }


        return {
            backgroundColor:
                "#fef3c7",

            color:
                "#92400e",
        };

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div>


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div
                className="admin-page-header"
            >

                <div>

                    <h2>
                        Manage Bids
                    </h2>

                    <p
                        style={{
                            margin:
                                "0.35rem 0 0",

                            color:
                                "#6b7280",
                        }}
                    >
                        View and manage all
                        auction bids.
                    </p>

                </div>


                <button
                    className="admin-btn"
                    onClick={
                        fetchBids
                    }
                    disabled={
                        loading
                    }
                >

                    <RefreshCw
                        size={17}
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="admin-card"
                    style={{
                        backgroundColor:
                            "#fef2f2",

                        border:
                            "1px solid #fecaca",

                        color:
                            "#b91c1c",
                    }}
                >

                    {error}

                </div>

            )}


            {/* =================================================
                SEARCH + FILTERS
            ================================================= */}

            <div
                className="admin-card"
                style={{
                    marginBottom:
                        "1.5rem",
                }}
            >

                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "1rem",

                        alignItems:
                            "center",

                        flexWrap:
                            "wrap",
                    }}
                >


                    {/* SEARCH */}

                    <div
                        style={{
                            position:
                                "relative",

                            flex:
                                "1 1 350px",

                            maxWidth:
                                "500px",
                        }}
                    >

                        <Search
                            size={18}
                            style={{
                                position:
                                    "absolute",

                                left:
                                    "0.85rem",

                                top:
                                    "50%",

                                transform:
                                    "translateY(-50%)",

                                color:
                                    "#6b7280",

                                pointerEvents:
                                    "none",
                            }}
                        />


                        <input
                            type="text"
                            value={
                                searchTerm
                            }
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                            placeholder="Search equipment, bidder or seller..."
                            style={{
                                width:
                                    "100%",

                                padding:
                                    "0.75rem 1rem 0.75rem 2.6rem",

                                border:
                                    "1px solid #d1d5db",

                                borderRadius:
                                    "0.375rem",

                                fontFamily:
                                    "inherit",

                                fontSize:
                                    "0.95rem",

                                boxSizing:
                                    "border-box",

                                outline:
                                    "none",
                            }}
                        />

                    </div>


                    {/* STATUS */}

                    <div
                        style={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            gap:
                                "0.5rem",
                        }}
                    >

                        <label
                            htmlFor="bidStatusFilter"
                            style={{
                                fontWeight:
                                    500,

                                color:
                                    "#374151",
                            }}
                        >
                            Status:
                        </label>


                        <select
                            id="bidStatusFilter"
                            value={
                                statusFilter
                            }
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            style={{
                                padding:
                                    "0.7rem 2rem 0.7rem 0.75rem",

                                border:
                                    "1px solid #d1d5db",

                                borderRadius:
                                    "0.375rem",

                                background:
                                    "white",

                                fontFamily:
                                    "inherit",

                                cursor:
                                    "pointer",
                            }}
                        >

                            <option value="All">
                                All
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Accepted">
                                Accepted
                            </option>

                            <option value="Rejected">
                                Rejected
                            </option>

                        </select>

                    </div>

                </div>


                {/* COUNTS */}

                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "1.25rem",

                        marginTop:
                            "1rem",

                        flexWrap:
                            "wrap",

                        fontSize:
                            "0.85rem",

                        color:
                            "#6b7280",
                    }}
                >

                    <span>
                        Total:{" "}
                        <strong>
                            {
                                statusCounts.all
                            }
                        </strong>
                    </span>

                    <span>
                        Pending:{" "}
                        <strong>
                            {
                                statusCounts.pending
                            }
                        </strong>
                    </span>

                    <span>
                        Accepted:{" "}
                        <strong>
                            {
                                statusCounts.accepted
                            }
                        </strong>
                    </span>

                    <span>
                        Rejected:{" "}
                        <strong>
                            {
                                statusCounts.rejected
                            }
                        </strong>
                    </span>


                    {(searchTerm ||
                        statusFilter !==
                        "All") && (

                        <span>
                            Showing:{" "}
                            <strong>
                                {
                                    filteredBids.length
                                }
                            </strong>
                        </span>

                    )}

                </div>

            </div>


            {/* =================================================
                BIDS TABLE
            ================================================= */}

            <div
                className="admin-card"
            >

                {loading ? (

                    <div
                        style={{
                            padding:
                                "2rem",

                            textAlign:
                                "center",

                            color:
                                "#6b7280",
                        }}
                    >

                        Loading bids...

                    </div>

                ) : (

                    <div
                        className="admin-table-wrapper"
                    >

                        <table
                            className="admin-table"
                        >

                            <thead>

                            <tr>

                                <th>
                                    Equipment
                                </th>

                                <th>
                                    Bidder
                                </th>

                                <th>
                                    Seller
                                </th>

                                <th>
                                    Bid Amount
                                </th>

                                <th>
                                    Date / Time
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

                            {filteredBids.map(
                                (bid) => {

                                    const isProcessing =
                                        actionId ===
                                        bid.id;


                                    return (

                                        <tr
                                            key={
                                                bid.id
                                            }
                                        >


                                            {/* EQUIPMENT */}

                                            <td>

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            "0.75rem",

                                                        minWidth:
                                                            "200px",
                                                    }}
                                                >

                                                    {bid.equipmentImage ? (

                                                        <img
                                                            src={
                                                                bid.equipmentImage
                                                            }
                                                            alt={
                                                                bid.equipmentName ||
                                                                "Equipment"
                                                            }
                                                            style={{
                                                                width:
                                                                    "50px",

                                                                height:
                                                                    "50px",

                                                                objectFit:
                                                                    "cover",

                                                                borderRadius:
                                                                    "0.375rem",
                                                            }}
                                                        />

                                                    ) : (

                                                        <div
                                                            style={{
                                                                width:
                                                                    "50px",

                                                                height:
                                                                    "50px",

                                                                borderRadius:
                                                                    "0.375rem",

                                                                backgroundColor:
                                                                    "#f3f4f6",

                                                                display:
                                                                    "flex",

                                                                alignItems:
                                                                    "center",

                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >

                                                            <Gavel
                                                                size={
                                                                    20
                                                                }
                                                            />

                                                        </div>

                                                    )}


                                                    <div>

                                                        <strong>
                                                            {
                                                                bid.equipmentName ||
                                                                "Unknown Equipment"
                                                            }
                                                        </strong>


                                                        {bid.sector && (

                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "0.8rem",

                                                                    color:
                                                                        "#6b7280",

                                                                    marginTop:
                                                                        "0.2rem",
                                                                }}
                                                            >

                                                                {
                                                                    bid.sector
                                                                }

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </td>


                                            {/* BIDDER */}

                                            <td>

                                                <div>

                                                    <strong>
                                                        {
                                                            bid.bidderName ||
                                                            "Unknown Bidder"
                                                        }
                                                    </strong>


                                                    {bid.bidderEmail && (

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.8rem",

                                                                color:
                                                                    "#6b7280",

                                                                marginTop:
                                                                    "0.2rem",
                                                            }}
                                                        >

                                                            {
                                                                bid.bidderEmail
                                                            }

                                                        </div>

                                                    )}

                                                </div>

                                            </td>


                                            {/* SELLER */}

                                            <td>

                                                <div>

                                                    <strong>
                                                        {
                                                            bid.sellerName ||
                                                            bid.sellerCompany ||
                                                            "—"
                                                        }
                                                    </strong>


                                                    {bid.sellerEmail && (

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.8rem",

                                                                color:
                                                                    "#6b7280",

                                                                marginTop:
                                                                    "0.2rem",
                                                            }}
                                                        >

                                                            {
                                                                bid.sellerEmail
                                                            }

                                                        </div>

                                                    )}

                                                </div>

                                            </td>


                                            {/* AMOUNT */}

                                            <td>

                                                <strong>
                                                    {
                                                        formatAmount(
                                                            bid.bidAmount
                                                        )
                                                    }
                                                </strong>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                {
                                                    formatDate(
                                                        bid.createdAt
                                                    )
                                                }

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                    <span
                                                        style={{
                                                            ...getStatusStyle(
                                                                bid.status
                                                            ),

                                                            display:
                                                                "inline-block",

                                                            padding:
                                                                "0.35rem 0.65rem",

                                                            borderRadius:
                                                                "999px",

                                                            fontSize:
                                                                "0.8rem",

                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >

                                                        {
                                                            bid.status ||
                                                            "Pending"
                                                        }

                                                    </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div
                                                    className="action-btns"
                                                    style={{
                                                        flexWrap:
                                                            "wrap",

                                                        minWidth:
                                                            "180px",
                                                    }}
                                                >


                                                    {/* ACCEPT */}

                                                    {bid.status !==
                                                        "Accepted" && (

                                                            <button
                                                                className="icon-action-btn"
                                                                title="Accept Bid"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    updateBidStatus(
                                                                        bid.id,
                                                                        "Accepted"
                                                                    )
                                                                }
                                                                style={{
                                                                    color:
                                                                        "#16a34a",
                                                                }}
                                                            >

                                                                <CheckCircle
                                                                    size={
                                                                        18
                                                                    }
                                                                />

                                                            </button>

                                                        )}


                                                    {/* REJECT */}

                                                    {bid.status !==
                                                        "Rejected" && (

                                                            <button
                                                                className="icon-action-btn"
                                                                title="Reject Bid"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    updateBidStatus(
                                                                        bid.id,
                                                                        "Rejected"
                                                                    )
                                                                }
                                                                style={{
                                                                    color:
                                                                        "#dc2626",
                                                                }}
                                                            >

                                                                <XCircle
                                                                    size={
                                                                        18
                                                                    }
                                                                />

                                                            </button>

                                                        )}


                                                    {/* DELETE */}

                                                    <button
                                                        className="icon-action-btn delete"
                                                        title="Delete Bid"
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        onClick={() =>
                                                            deleteBid(
                                                                bid.id
                                                            )
                                                        }
                                                    >

                                                        <Trash2
                                                            size={
                                                                18
                                                            }
                                                        />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}


                            {/* NO RESULTS */}

                            {filteredBids.length ===
                                0 && (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            style={{
                                                textAlign:
                                                    "center",

                                                padding:
                                                    "3rem",

                                                color:
                                                    "#6b7280",
                                            }}
                                        >

                                            {bids.length ===
                                            0
                                                ? "No bids found."
                                                : "No bids match the current search or filter."}

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );

};


export default ManageBids;