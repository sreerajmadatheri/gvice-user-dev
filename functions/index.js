const { onCall } = require("firebase-functions/v2/https");

const { setGlobalOptions } = require("firebase-functions");

const { initializeApp } = require("firebase-admin/app");

const { getFirestore } = require("firebase-admin/firestore");

const { getAuth } = require("firebase-admin/auth");

const { getMessaging } = require("firebase-admin/messaging");

const Brevo = require("@getbrevo/brevo");


// ---------------------------------------------------------
// Global options
// ---------------------------------------------------------

setGlobalOptions({
    maxInstances: 10,
});


// ---------------------------------------------------------
// Firebase Admin
// ---------------------------------------------------------

initializeApp();

const db = getFirestore();

const adminAuth = getAuth();

const messaging = getMessaging();


// ---------------------------------------------------------
// Brevo
// ---------------------------------------------------------

const brevoClient = new Brevo.BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});


// =========================================================
// BID NOTIFICATION HELPERS
// =========================================================


// ---------------------------------------------------------
// Helper: format bid amount
// ---------------------------------------------------------

function formatBidAmount(amount) {

    if (typeof amount !== "number") {
        return String(amount ?? "");
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}


// ---------------------------------------------------------
// Helper: get seller information
// ---------------------------------------------------------

async function getSellerInformation(
    sellerUserId
) {

    if (!sellerUserId) {

        console.warn(
            "No sellerUserId found in bid document."
        );

        return null;
    }


    const sellerRef =
        db
            .collection("users")
            .doc(sellerUserId);


    const sellerSnap =
        await sellerRef.get();


    if (!sellerSnap.exists) {

        console.warn(
            `Seller user document not found: ${sellerUserId}`
        );

        return null;
    }


    const sellerData =
        sellerSnap.data();


    return {

        userId:
        sellerUserId,

        email:
            sellerData.email || "",

        displayName:
            sellerData.displayName ||
            sellerData.name ||
            "",

    };
}


// ---------------------------------------------------------
// Helper: get seller FCM tokens
// ---------------------------------------------------------

async function getSellerTokens(
    sellerUserId
) {

    if (!sellerUserId) {
        return [];
    }


    const tokensSnapshot =
        await db
            .collection("users")
            .doc(sellerUserId)
            .collection("fcmTokens")
            .get();


    if (tokensSnapshot.empty) {

        console.log(
            `No FCM tokens found for seller: ${sellerUserId}`
        );

        return [];
    }


    const tokens = [];


    tokensSnapshot.forEach(
        (doc) => {

            const data =
                doc.data();


            if (data.token) {

                tokens.push(
                    data.token
                );

            }

        }
    );


    console.log(
        `Found ${tokens.length} FCM token(s) for seller: ${sellerUserId}`
    );


    return tokens;
}


// ---------------------------------------------------------
// Helper: send push notification
// ---------------------------------------------------------

async function sendPushNotification({
                                        tokens,
                                        equipmentName,
                                        bidAmount,
                                        oldBidAmount,
                                        bidderName,
                                        notificationType,
                                    }) {

    if (!tokens.length) {

        console.log(
            "Skipping push notification: no FCM tokens."
        );

        return;
    }


    const isUpdate =
        notificationType === "updated";


    const title =
        isUpdate
            ? "Bid Updated"
            : "New Bid Received";


    let body;


    if (isUpdate) {

        body =
            `${bidderName || "A bidder"} updated their bid ` +
            `from ${formatBidAmount(oldBidAmount)} to ` +
            `${formatBidAmount(bidAmount)} on ` +
            `${equipmentName || "your equipment"}.`;

    } else {

        body =
            `${bidderName || "A bidder"} placed a bid of ` +
            `${formatBidAmount(bidAmount)} on ` +
            `${equipmentName || "your equipment"}.`;

    }


    console.log(
        "Sending push notification:",
        {
            title,
            body,
            tokenCount:
            tokens.length,
            notificationType,
        }
    );


    try {

        console.log(
            "FCM send started."
        );


        const response =
            await messaging
                .sendEachForMulticast({

                    tokens,

                    notification: {
                        title,
                        body,
                    },

                    data: {

                        type:
                            isUpdate
                                ? "bid_updated"
                                : "bid",

                        equipmentName:
                            equipmentName || "",

                        bidAmount:
                            String(
                                bidAmount ?? ""
                            ),

                        oldBidAmount:
                            String(
                                oldBidAmount ?? ""
                            ),

                    },

                    webpush: {

                        notification: {

                            title,
                            body,

                            icon:
                                "/gvice-user-dev/favicon.ico",

                        },

                    },

                });


        console.log(
            "FCM response:",
            {
                successCount:
                response.successCount,

                failureCount:
                response.failureCount,
            }
        );


        response.responses.forEach(
            (result, index) => {

                if (!result.success) {

                    console.warn(
                        "FCM token failed:",
                        {
                            index,

                            errorCode:
                                result.error?.code ||
                                "",

                            message:
                                result.error?.message ||
                                "",
                        }
                    );

                }

            }
        );


        console.log(
            "FCM send completed successfully."
        );


        return response;

    } catch (error) {

        console.error(
            "FCM notification failed:",
            error
        );


        console.error(
            "FCM error code:",
            error?.code
        );


        console.error(
            "FCM error message:",
            error?.message
        );


        console.warn(
            "Continuing with email notification despite FCM failure."
        );


        return null;

    }

}


// ---------------------------------------------------------
// Helper: send Brevo email
// ---------------------------------------------------------

async function sendEmailNotification({
                                         seller,
                                         equipmentName,
                                         bidAmount,
                                         oldBidAmount,
                                         bidderName,
                                         status,
                                         notificationType,
                                     }) {

    if (!seller?.email) {

        console.warn(
            "Skipping email: seller email not found."
        );

        return null;
    }


    const isUpdate =
        notificationType === "updated";


    const formattedAmount =
        formatBidAmount(
            bidAmount
        );


    const formattedOldAmount =
        formatBidAmount(
            oldBidAmount
        );


    const subject =
        isUpdate
            ? `Bid Updated - ${equipmentName || "Your Equipment"}`
            : `New Bid Received - ${equipmentName || "Your Equipment"}`;


    const heading =
        isUpdate
            ? "Your bid has been updated"
            : "You have received a new bid";


    const bidDescription =
        isUpdate

            ? `
                <p>
                    The bid on your equipment has been updated.
                </p>

                <p>
                    The bidder changed their bid from
                    <strong>${formattedOldAmount}</strong>
                    to
                    <strong>${formattedAmount}</strong>.
                </p>
            `

            : `
                <p>
                    Someone has placed a new bid on your equipment.
                </p>
            `;


    const htmlContent = `

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8" />

            <meta
                name="viewport"
                content="width=device-width,
                         initial-scale=1.0"
            />

            <title>${subject}</title>

        </head>


        <body
            style="
                margin:0;
                padding:0;
                background:#f4f6f8;
                font-family:Arial,Helvetica,sans-serif;
                color:#1f2937;
            "
        >

            <div
                style="
                    max-width:600px;
                    margin:30px auto;
                    background:#ffffff;
                    border-radius:10px;
                    overflow:hidden;
                    box-shadow:0 2px 10px rgba(0,0,0,0.08);
                "
            >

                <div
                    style="
                        background:#1f4f8f;
                        color:#ffffff;
                        padding:24px;
                    "
                >

                    <h1
                        style="
                            margin:0;
                            font-size:24px;
                        "
                    >
                        GVICE
                    </h1>


                    <p
                        style="
                            margin:8px 0 0;
                            font-size:14px;
                        "
                    >
                        Equipment Marketplace
                    </p>

                </div>


                <div
                    style="
                        padding:28px;
                    "
                >

                    <h2
                        style="
                            margin-top:0;
                            color:#111827;
                        "
                    >
                        ${heading}
                    </h2>


                    <p>
                        Hello
                        ${seller.displayName || "there"},
                    </p>


                    ${bidDescription}


                    <table
                        style="
                            width:100%;
                            border-collapse:collapse;
                            margin:20px 0;
                        "
                    >

                        <tr>

                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                    font-weight:bold;
                                "
                            >
                                Equipment
                            </td>


                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                "
                            >
                                ${equipmentName || "-"}
                            </td>

                        </tr>


                        ${
        isUpdate
            ? `

                        <tr>

                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                    font-weight:bold;
                                "
                            >
                                Previous Bid
                            </td>


                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                "
                            >
                                ${formattedOldAmount}
                            </td>

                        </tr>

                                `
            : ""
    }


                        <tr>

                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                    font-weight:bold;
                                "
                            >
                                Current Bid
                            </td>


                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                "
                            >
                                ${formattedAmount}
                            </td>

                        </tr>


                        <tr>

                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                    font-weight:bold;
                                "
                            >
                                Bidder
                            </td>


                            <td
                                style="
                                    padding:10px;
                                    border-bottom:1px solid #e5e7eb;
                                "
                            >
                                ${bidderName || "-"}
                            </td>

                        </tr>


                        <tr>

                            <td
                                style="
                                    padding:10px;
                                    font-weight:bold;
                                "
                            >
                                Status
                            </td>


                            <td
                                style="
                                    padding:10px;
                                "
                            >
                                ${status || "-"}
                            </td>

                        </tr>

                    </table>


                    <p>
                        Please log in to your GVICE account
                        to review the bid.
                    </p>


                    <p
                        style="
                            margin-top:30px;
                            color:#6b7280;
                            font-size:13px;
                        "
                    >
                        This is an automated notification
                        from GVICE.
                    </p>

                </div>

            </div>

        </body>

        </html>
    `;


    console.log(
        "Sending Brevo email:",
        {
            to:
            seller.email,

            subject,

            notificationType,
        }
    );


    try {

        console.log(
            "Brevo send started."
        );


        const response =
            await brevoClient
                .transactionalEmails
                .sendTransacEmail({

                    sender: {

                        email:
                            process.env.BREVO_SENDER_EMAIL ||
                            "contact@ventaailabs.com",

                        name:
                            process.env.BREVO_SENDER_NAME ||
                            "GVICE",

                    },


                    to: [

                        {

                            email:
                            seller.email,

                            name:
                                seller.displayName ||
                                undefined,

                        },

                    ],


                    subject,

                    htmlContent,

                });


        console.log(
            "Brevo email sent successfully:",
            response
        );


        return response;

    } catch (error) {

        console.error(
            "Brevo email failed:",
            error
        );


        console.error(
            "Brevo error message:",
            error?.message
        );


        return null;

    }

}


// ---------------------------------------------------------
// Process notification
// ---------------------------------------------------------

async function processBidNotification(
    bid,
    notificationType,
    oldBidAmount = null
) {

    console.log(
        "=========================================="
    );


    console.log(
        "Processing bid notification"
    );


    console.log(
        "Notification type:",
        notificationType
    );


    console.log(
        "Bid:",
        bid
    );


    const sellerUserId =
        bid.sellerUserId;


    if (!sellerUserId) {

        console.warn(
            "Bid does not contain sellerUserId."
        );

        return;
    }


    const seller =
        await getSellerInformation(
            sellerUserId
        );


    if (!seller) {
        return;
    }


    const tokens =
        await getSellerTokens(
            sellerUserId
        );


    try {

        await sendPushNotification({

            tokens,

            equipmentName:
            bid.equipmentName,

            bidAmount:
            bid.bidAmount,

            oldBidAmount,

            bidderName:
            bid.bidderName,

            notificationType,

        });

    } catch (error) {

        console.error(
            "Unexpected FCM processing error:",
            error
        );


        console.warn(
            "Continuing to Brevo email."
        );

    }


    try {

        await sendEmailNotification({

            seller,

            equipmentName:
            bid.equipmentName,

            bidAmount:
            bid.bidAmount,

            oldBidAmount,

            bidderName:
            bid.bidderName,

            status:
            bid.status,

            notificationType,

        });

    } catch (error) {

        console.error(
            "Unexpected Brevo processing error:",
            error
        );

    }


    console.log(
        "Bid notification processing completed."
    );


    console.log(
        "=========================================="
    );

}


// =========================================================
// CALLABLE: BID NOTIFICATION
// =========================================================

exports.notifyBid = onCall(

    {
        region: "asia-south1",

        secrets: [
            "BREVO_API_KEY",
        ],
    },


    async (request) => {

        console.log(
            "=========================================="
        );


        console.log(
            "notifyBid callable function invoked."
        );


        const data =
            request.data || {};


        console.log(
            "Notification request:",
            data
        );


        if (!data.sellerUserId) {

            console.warn(
                "Missing sellerUserId."
            );


            return {

                success: false,

                message:
                    "Missing sellerUserId.",

            };

        }


        if (!data.equipmentName) {

            console.warn(
                "Missing equipmentName."
            );


            return {

                success: false,

                message:
                    "Missing equipmentName.",

            };

        }


        if (
            data.bidAmount === undefined ||
            data.bidAmount === null
        ) {

            console.warn(
                "Missing bidAmount."
            );


            return {

                success: false,

                message:
                    "Missing bidAmount.",

            };

        }


        try {

            await processBidNotification(

                data,

                data.notificationType ||
                "created",

                data.oldBidAmount ??
                null

            );


            console.log(
                "notifyBid completed successfully."
            );


            console.log(
                "=========================================="
            );


            return {

                success: true,

                message:
                    "Bid notification processed successfully.",

            };

        } catch (error) {

            console.error(
                "notifyBid failed:",
                error
            );


            console.log(
                "=========================================="
            );


            return {

                success: false,

                message:
                    error?.message ||
                    "Bid notification failed.",

            };

        }

    }

);


// =========================================================
// ADMIN HELPERS
// =========================================================

const ADMIN_CORS = [

    "https://sreerajmadatheri.github.io",

    "http://localhost:5173",

    "http://localhost:5174",

];


async function verifyAdmin(request) {

    if (!request.auth) {

        return {

            success: false,

            message:
                "Authentication is required.",

        };

    }


    const callerUid =
        request.auth.uid;


    const callerAdminSnap =
        await db
            .collection("admins")
            .doc(callerUid)
            .get();


    const callerIsAdmin =
        callerAdminSnap.exists &&
        callerAdminSnap.data()?.role ===
        "admin";


    if (!callerIsAdmin) {

        return {

            success: false,

            message:
                "Administrator permission is required.",

        };

    }


    return {

        success: true,

        uid:
        callerUid,

    };

}


// =========================================================
// CALLABLE: GET ADMIN USER IDS
// =========================================================
//
// The browser cannot query the complete /admins collection
// because Firestore rules intentionally allow a user to read
// only their own admin document.
//
// This callable lets an authenticated administrator retrieve
// the authoritative list of administrator UIDs.
//

exports.getAdminUsers = onCall(

    {
        region: "asia-south1",

        cors:
        ADMIN_CORS,

    },


    async (request) => {

        console.log(
            "getAdminUsers callable function invoked."
        );


        const authorization =
            await verifyAdmin(
                request
            );


        if (!authorization.success) {

            return authorization;

        }


        try {

            const snapshot =
                await db
                    .collection("admins")
                    .get();


            const adminUserIds = [];


            snapshot.forEach(
                (adminDoc) => {

                    const data =
                        adminDoc.data();


                    if (
                        data?.role ===
                        "admin"
                    ) {

                        adminUserIds.push(
                            adminDoc.id
                        );

                    }

                }
            );


            console.log(
                `Found ${adminUserIds.length} administrator(s).`
            );


            return {

                success: true,

                adminUserIds,

            };

        } catch (error) {

            console.error(
                "getAdminUsers failed:",
                error
            );


            return {

                success: false,

                message:
                    error?.message ||
                    "Unable to retrieve administrators.",

            };

        }

    }

);


// =========================================================
// CALLABLE: SET USER ADMIN STATUS
// =========================================================
//
// makeAdmin = true
//     User becomes Admin.
//
// makeAdmin = false
//     Admin rights are removed.
//
// IMPORTANT:
// Removing Admin rights does NOT deactivate the user.
// The user remains active as a normal user.
//
// =========================================================

exports.setUserAdmin = onCall(

    {
        region: "asia-south1",

        cors:
        ADMIN_CORS,

    },


    async (request) => {

        console.log(
            "=========================================="
        );


        console.log(
            "setUserAdmin callable function invoked."
        );


        const authorization =
            await verifyAdmin(
                request
            );


        if (!authorization.success) {

            console.warn(
                "Unauthorized setUserAdmin request."
            );


            return authorization;

        }


        const callerUid =
            authorization.uid;


        const data =
            request.data || {};


        const targetUserId =
            data.targetUserId;


        const makeAdmin =
            data.makeAdmin;


        // -------------------------------------------------
        // Validate target UID
        // -------------------------------------------------

        if (
            !targetUserId ||
            typeof targetUserId !==
            "string"
        ) {

            return {

                success: false,

                message:
                    "A valid targetUserId is required.",

            };

        }


        // -------------------------------------------------
        // Validate makeAdmin
        // -------------------------------------------------

        if (
            typeof makeAdmin !==
            "boolean"
        ) {

            return {

                success: false,

                message:
                    "makeAdmin must be true or false.",

            };

        }


        // -------------------------------------------------
        // Prevent self modification
        // -------------------------------------------------

        if (
            targetUserId ===
            callerUid
        ) {

            console.warn(
                "Admin attempted to change own admin status:",
                callerUid
            );


            return {

                success: false,

                message:
                    "You cannot change your own administrator status.",

            };

        }


        // -------------------------------------------------
        // Get target user
        // -------------------------------------------------

        const targetUserRef =
            db
                .collection("users")
                .doc(targetUserId);


        const targetUserSnap =
            await targetUserRef.get();


        if (!targetUserSnap.exists) {

            return {

                success: false,

                message:
                    "Target user profile was not found.",

            };

        }


        const targetUser =
            targetUserSnap.data();


        console.log(
            "Target user:",
            {

                uid:
                targetUserId,

                email:
                    targetUser?.email ||
                    "",

                currentRole:
                    targetUser?.role ||
                    "user",

                requestedRole:
                    makeAdmin
                        ? "admin"
                        : "user",

            }
        );


        const adminRef =
            db
                .collection("admins")
                .doc(targetUserId);


        const batch =
            db.batch();


        // =================================================
        // MAKE ADMIN
        // =================================================

        if (makeAdmin) {

            console.log(
                "Promoting user to admin:",
                targetUserId
            );


            batch.set(

                adminRef,

                {

                    role:
                        "admin",

                },

                {

                    merge:
                        true,

                }

            );


            batch.update(

                targetUserRef,

                {

                    role:
                        "admin",

                    // Making somebody Admin must NOT
                    // accidentally deactivate them.

                    isActive:
                        targetUser.isActive === false
                            ? false
                            : true,

                    updatedAt:
                        new Date(),

                }

            );


            await batch.commit();


            // If the user was previously disabled,
            // do not automatically enable them here.
            //
            // Admin promotion and account activation
            // remain separate operations.


            console.log(
                "User promoted to admin successfully:",
                targetUserId
            );


            return {

                success:
                    true,

                message:
                    "User promoted to Admin successfully.",

                userId:
                targetUserId,

                role:
                    "admin",

            };

        }


        // =================================================
        // REMOVE ADMIN
        // =================================================

        console.log(
            "Removing admin access:",
            targetUserId
        );


        // Remove /admins/{uid}.

        batch.delete(
            adminRef
        );


        // IMPORTANT:
        //
        // Removing admin does NOT deactivate.
        //
        // Keep the user's existing active status.

        batch.update(

            targetUserRef,

            {

                role:
                    "user",

                isActive:
                    targetUser.isActive === false
                        ? false
                        : true,

                updatedAt:
                    new Date(),

            }

        );


        await batch.commit();


        console.log(
            "Admin access removed successfully:",
            targetUserId
        );


        return {

            success:
                true,

            message:
                "Admin access removed successfully. User remains active.",

            userId:
            targetUserId,

            role:
                "user",

            isActive:
                targetUser.isActive === false
                    ? false
                    : true,

        };

    }

);


// =========================================================
// CALLABLE: SET USER ACCOUNT STATUS
// =========================================================
//
// isActive = false
//     User becomes inactive.
//     Firebase Authentication account is disabled.
//     Admin access is also removed.
//
// isActive = true
//     User becomes active.
//     Firebase Authentication account is enabled.
//     User remains a normal user.
//
// IMPORTANT:
// Activation does NOT grant Admin rights.
//
// =========================================================

exports.setUserStatus = onCall(

    {
        region: "asia-south1",

        cors:
        ADMIN_CORS,

    },


    async (request) => {

        console.log(
            "=========================================="
        );


        console.log(
            "setUserStatus callable function invoked."
        );


        const authorization =
            await verifyAdmin(
                request
            );


        if (!authorization.success) {

            return authorization;

        }


        const callerUid =
            authorization.uid;


        const data =
            request.data || {};


        const targetUserId =
            data.targetUserId;


        const isActive =
            data.isActive;


        // -------------------------------------------------
        // Validate target UID
        // -------------------------------------------------

        if (
            !targetUserId ||
            typeof targetUserId !==
            "string"
        ) {

            return {

                success: false,

                message:
                    "A valid targetUserId is required.",

            };

        }


        // -------------------------------------------------
        // Validate status
        // -------------------------------------------------

        if (
            typeof isActive !==
            "boolean"
        ) {

            return {

                success: false,

                message:
                    "isActive must be true or false.",

            };

        }


        // -------------------------------------------------
        // Prevent self deactivation
        // -------------------------------------------------

        if (
            targetUserId ===
            callerUid
        ) {

            return {

                success: false,

                message:
                    "You cannot change your own account status.",

            };

        }


        // -------------------------------------------------
        // Get target user
        // -------------------------------------------------

        const targetUserRef =
            db
                .collection("users")
                .doc(targetUserId);


        const targetUserSnap =
            await targetUserRef.get();


        if (!targetUserSnap.exists) {

            return {

                success: false,

                message:
                    "Target user profile was not found.",

            };

        }


        // -------------------------------------------------
        // Get Admin record
        // -------------------------------------------------

        const targetAdminRef =
            db
                .collection("admins")
                .doc(targetUserId);


        const batch =
            db.batch();


        // =================================================
        // DEACTIVATE
        // =================================================

        if (!isActive) {

            console.log(
                "Deactivating user:",
                targetUserId
            );


            // -------------------------------------------------
            // IMPORTANT:
            //
            // An inactive account must not remain an Admin.
            // -------------------------------------------------

            batch.delete(
                targetAdminRef
            );


            batch.update(

                targetUserRef,

                {

                    role:
                        "user",

                    isActive:
                        false,

                    updatedAt:
                        new Date(),

                }

            );


            await batch.commit();


            // -------------------------------------------------
            // Disable Firebase Authentication account
            // -------------------------------------------------

            try {

                await adminAuth.updateUser(

                    targetUserId,

                    {

                        disabled:
                            true,

                    }

                );

            } catch (authError) {

                console.error(
                    "Failed to disable Firebase Authentication user:",
                    authError
                );


                // Roll back Firestore state if Auth
                // update failed.

                await db
                    .collection("users")
                    .doc(targetUserId)
                    .update({

                        isActive:
                            true,

                        updatedAt:
                            new Date(),

                    });


                throw authError;

            }


            console.log(
                "User deactivated successfully:",
                targetUserId
            );


            return {

                success:
                    true,

                message:
                    "User deactivated successfully.",

                userId:
                targetUserId,

                isActive:
                    false,

                role:
                    "user",

            };

        }


        // =================================================
        // ACTIVATE
        // =================================================

        console.log(
            "Activating user:",
            targetUserId
        );


        // -------------------------------------------------
        // Activation does NOT create an Admin record.
        // -------------------------------------------------

        batch.update(

            targetUserRef,

            {

                isActive:
                    true,

                role:
                    "user",

                updatedAt:
                    new Date(),

            }

        );


        await batch.commit();


        // -------------------------------------------------
        // Enable Firebase Authentication account
        // -------------------------------------------------

        try {

            await adminAuth.updateUser(

                targetUserId,

                {

                    disabled:
                        false,

                }

            );

        } catch (authError) {

            console.error(
                "Failed to enable Firebase Authentication user:",
                authError
            );


            // Roll back Firestore state if Auth
            // update failed.

            await db
                .collection("users")
                .doc(targetUserId)
                .update({

                    isActive:
                        false,

                    updatedAt:
                        new Date(),

                });


            throw authError;

        }


        console.log(
            "User activated successfully:",
            targetUserId
        );


        return {

            success:
                true,

            message:
                "User activated successfully.",

            userId:
            targetUserId,

            isActive:
                true,

            role:
                "user",

        };

    }

);